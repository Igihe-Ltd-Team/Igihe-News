// ─── API Client ──────────────────────────────────────────────────────────────
// Low-level HTTP helpers: fetch with timeout, retry, and exponential backoff.

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_WORDPRESS_API_URL!,
  timeout: 20_000,
  retryAttempts: 3,
} as const

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

/**
 * Fetch with automatic timeout, retry, and exponential backoff.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API_CONFIG.timeout
): Promise<Response> {
  let lastError: Error | null = null
  const maxRetries = API_CONFIG.retryAttempts
  const isServer = typeof window === 'undefined'

  // Cache-bust on the client for GET requests
  let finalUrl = url
  if ((!options.method || options.method === 'GET') && !isServer) {
    finalUrl = url.includes('?')
      ? `${url}&_=${Date.now()}`
      : `${url}?_=${Date.now()}`
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const fetchOptions: RequestInit = {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(options.method !== 'GET' && { 'Content-Type': 'application/json' }),
          ...options.headers,
        },
      }

      const response = await fetch(finalUrl, fetchOptions)
      clearTimeout(timer)

      if (!response.ok) {
        const status = response.status
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

      return response
    } catch (error: any) {
      clearTimeout(timer)

      if (attempt < maxRetries) {
        lastError = error
        await backoff(attempt)
        continue
      }

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
