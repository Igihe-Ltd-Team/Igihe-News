// Thin WordPress REST client for the sitemap job. Separate from
// services/apiClient on purpose: this path needs `_fields`-trimmed payloads,
// stable pagination and no memory/file caching of 500+ page sweeps.

import { WP_FETCH, getWordPressApiUrl } from './config.ts'

export interface WpPage<T> {
  data: T[]
  total: number
  totalPages: number
}

export type WpParams = Record<string, string | number | boolean | undefined>

function buildUrl(endpoint: string, params: WpParams): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return `${getWordPressApiUrl()}/${endpoint.replace(/^\/+/, '')}${query ? `?${query}` : ''}`
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function wpFetchPage<T>(endpoint: string, params: WpParams): Promise<WpPage<T>> {
  const url = buildUrl(endpoint, params)
  let lastError: unknown

  for (let attempt = 0; attempt <= WP_FETCH.retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'IGIHE-Sitemap/1.0' },
        signal: AbortSignal.timeout(WP_FETCH.timeoutMs),
        cache: 'no-store',
      })

      if (!response.ok) {
        await response.body?.cancel().catch(() => {})
        // WordPress answers 400 `rest_post_invalid_page_number` when asked for
        // a page past the end — that is a clean "no more data", not an error.
        if (response.status === 400 && Number(params.page) > 1) {
          return { data: [], total: 0, totalPages: 0 }
        }
        const retryable = response.status === 429 || response.status >= 500
        if (!retryable || attempt === WP_FETCH.retries) {
          throw new Error(`WordPress ${endpoint} responded ${response.status}`)
        }
        lastError = new Error(`HTTP ${response.status}`)
        await sleep(2 ** attempt * 1000)
        continue
      }

      const data = (await response.json()) as T[]
      return {
        data: Array.isArray(data) ? data : [],
        total: Number(response.headers.get('X-WP-Total') || (Array.isArray(data) ? data.length : 0)),
        totalPages: Number(response.headers.get('X-WP-TotalPages') || 1),
      }
    } catch (error) {
      lastError = error
      if (attempt === WP_FETCH.retries) break
      await sleep(2 ** attempt * 1000)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`WordPress ${endpoint} request failed`)
}

export interface FetchAllOptions {
  perPage?: number
  concurrency?: number
  maxPages?: number
  onPage?: (info: { page: number; totalPages: number; received: number }) => void
}

/**
 * Fetches every page of a collection. Page 1 is fetched first to learn the
 * page count, then the rest run through a small worker pool. Order the query
 * by something append-only (`orderby=id&order=asc`) so rows don't shift
 * between pages while new content is published mid-sweep.
 */
export async function wpFetchAll<T>(endpoint: string, params: WpParams, options: FetchAllOptions = {}): Promise<T[]> {
  const perPage = options.perPage ?? WP_FETCH.perPage
  const concurrency = Math.max(1, options.concurrency ?? WP_FETCH.concurrency)

  const first = await wpFetchPage<T>(endpoint, { ...params, per_page: perPage, page: 1 })
  const totalPages = Math.min(first.totalPages || 1, options.maxPages ?? Number.MAX_SAFE_INTEGER)
  options.onPage?.({ page: 1, totalPages, received: first.data.length })

  const pages: T[][] = new Array(totalPages)
  pages[0] = first.data
  if (totalPages <= 1) return first.data

  let next = 2
  const worker = async () => {
    while (true) {
      const page = next++
      if (page > totalPages) return
      const result = await wpFetchPage<T>(endpoint, { ...params, per_page: perPage, page })
      pages[page - 1] = result.data
      options.onPage?.({ page, totalPages, received: result.data.length })
      if (result.data.length === 0) return
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, totalPages - 1) }, worker))
  return pages.flatMap(page => page ?? [])
}
