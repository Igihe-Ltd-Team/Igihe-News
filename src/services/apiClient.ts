// ─── API Client ──────────────────────────────────────────────────────────────
// Low-level HTTP helpers: fetch with timeout, retry+backoff, and a circuit
// breaker that stops retrying once the upstream is confirmed down.

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_WORDPRESS_API_URL!,
  timeout: 20_000,
  retryAttempts: 3,
  // After this many fully-exhausted-retry failures in a row, stop attempting
  // requests entirely for circuitCooldownMs instead of retrying each one.
  circuitFailureThreshold: 5,
  circuitCooldownMs: 30_000,
} as const

/**
 * WordPress does not allow browser cross-origin requests. Keep server-side
 * requests direct, but route browser reads through the same-origin BFF proxy.
 */
export function resolveApiUrl(url: string, method = 'GET'): string {
  if (
    method !== 'GET' ||
    typeof window === 'undefined' ||
    !API_CONFIG.baseURL ||
    !url.startsWith(API_CONFIG.baseURL)
  ) {
    return url
  }

  const relative = url.slice(API_CONFIG.baseURL.length).replace(/^\/+/, '')
  return `/api/proxy/${relative}`
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = false
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Circuit breaker ─────────────────────────────────────────────────────────
// One process-wide breaker for the WordPress origin (this client only ever
// talks to one). Closed: requests flow normally. Open: every request fails
// immediately with no fetch attempted, until the cooldown elapses. Half-open:
// exactly one trial request is let through to check recovery — everything
// else keeps failing fast until that trial settles.

type CircuitState = 'closed' | 'open' | 'half-open'

let circuitState: CircuitState = 'closed'
let circuitFailureCount = 0
let circuitOpenedAt = 0

function assertCircuitClosed(): void {
  if (circuitState === 'closed') return

  if (circuitState === 'open') {
    if (Date.now() - circuitOpenedAt < API_CONFIG.circuitCooldownMs) {
      throw new ApiError('WordPress API unavailable — failing fast (circuit open)', 503, true)
    }
    circuitState = 'half-open' // cooldown elapsed — this call becomes the trial
    return
  }

  // half-open: a trial request is already in flight, keep failing fast
  throw new ApiError('WordPress API unavailable — failing fast (circuit open)', 503, true)
}

function recordCircuitSuccess(): void {
  if (circuitState !== 'closed') {
    console.warn('[apiClient] Circuit breaker CLOSED — WordPress API recovered')
  }
  circuitFailureCount = 0
  circuitState = 'closed'
}

function recordCircuitFailure(): void {
  circuitFailureCount++
  if (circuitState === 'half-open' || circuitFailureCount >= API_CONFIG.circuitFailureThreshold) {
    if (circuitState !== 'open') {
      console.warn(
        `[apiClient] Circuit breaker OPEN — WordPress API unresponsive after ${circuitFailureCount} failures, failing fast for ${API_CONFIG.circuitCooldownMs / 1000}s`
      )
    }
    circuitState = 'open'
    circuitOpenedAt = Date.now()
  }
}

/**
 * Fetch with automatic timeout, retry, exponential backoff, and a circuit
 * breaker that fails fast once the upstream is confirmed down.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API_CONFIG.timeout
): Promise<Response> {
  assertCircuitClosed()

  let lastError: Error | null = null
  const maxRetries = API_CONFIG.retryAttempts
  const method = options.method?.toUpperCase() || 'GET'
  const finalUrl = resolveApiUrl(url, method)

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const fetchOptions: RequestInit = {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(method !== 'GET' && { 'Content-Type': 'application/json' }),
          ...options.headers,
        },
      }

      const response = await fetch(finalUrl, fetchOptions)
      clearTimeout(timer)

      if (!response.ok) {
        const status = response.status
        // Drain the body so undici releases the connection back to the pool
        // immediately instead of waiting on GC — left unread, a discarded
        // Response can hold its socket (and the pool slot) for a while.
        await response.body?.cancel().catch(() => {})
        const shouldRetry =
          attempt < maxRetries &&
          (status === 429 || status >= 500 || status === 408 || status === 0)

        if (shouldRetry) {
          lastError = new Error(`HTTP error! status: ${status}`)
          await backoff(attempt)
          continue
        }

        throw new ApiError(`HTTP error! status: ${status}`, status, false)
      }

      recordCircuitSuccess()
      return response
    } catch (error: any) {
      clearTimeout(timer)

      if (attempt < maxRetries) {
        lastError = error
        await backoff(attempt)
        continue
      }

      recordCircuitFailure()

      const isTimeout =
        controller.signal.aborted ||
        error.name === 'AbortError' ||
        error.message === 'Request timed out'

      if (isTimeout) {
        throw new ApiError(
          `Request timed out after ${maxRetries + 1} attempts`,
          408,
          true
        )
      }

      throw error
    }
  }

  throw lastError || new Error(`Request failed after ${maxRetries + 1} attempts`)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function backoff(attempt: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
}

export function buildQuery(params: Record<string, any>): string {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.forEach(v => sp.append(key, v.toString()))
    } else {
      sp.append(key, value.toString())
    }
  })
  return sp.toString()
}

export function buildPaginationResponse<T>(
  data: T[],
  response: Response,
  params: { page?: number; per_page?: number }
) {
  return {
    data,
    pagination: {
      currentPage: params.page || 1,
      perPage: params.per_page || 10,
      totalPages: parseInt(response.headers.get('X-WP-TotalPages') || '1'),
      totalItems: parseInt(response.headers.get('X-WP-Total') || '0'),
      hasNextPage: (params.page || 1) < parseInt(response.headers.get('X-WP-TotalPages') || '1'),
    },
  }
}
