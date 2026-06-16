import { TraficNews, NewsItem } from '@/types/fetchData'
import { API_CONFIG, fetchWithTimeout } from './apiClient'
import { cachedRequest, cacheArticlesFromList } from './cacheManager'

const TRAFFIC_BASE = 'https://traffic.igihe.com/api/popular.php'

// ─── Popular / Traffic Articles ──────────────────────────────────────────────

export async function fetchMostPopularArticles(params?: {
  period?: 'day' | 'week' | 'month' | 'all'
  limit?: number
  page?: number
}): Promise<TraficNews[]> {
  const defaults = { period: 'week', limit: 10, page: 1, ...params }

  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries({ orderby: 'popularity', order: 'desc', ...defaults })
        .map(([k, v]) => [k, String(v)])
    )
  )

  return cachedRequest({
    key: `popular:${query}`,
    fetchFn: async () => {
      const response = await fetchWithTimeout(
        `${TRAFFIC_BASE}?property_id=igihe-en&${query}`
      )
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()

      if (Array.isArray(data) && data.length > 0) {
        cacheArticlesFromList(data as unknown as NewsItem[]).catch(() => {})
      }

      return data || []
    },
    // 24-hour TTL for popular articles
    getContentDate: () => String(24 * 60 * 60 * 1000),
  })
}

export async function fetchMostPopularArticlesFallback(params?: {
  period?: 'day' | 'week' | 'month' | 'all'
  limit?: number
  page?: number
}): Promise<TraficNews[]> {
  const defaults = { period: 'week', limit: 5, page: 1, ...params }

  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries({
        orderby: 'meta_value_num',
        order: 'desc',
        meta_key: 'pvt_views',
        ...defaults,
      }).map(([k, v]) => [k, String(v)])
    )
  )

  return cachedRequest({
    key: `popular:fallback:${query}`,
    fetchFn: async () => {
      const response = await fetchWithTimeout(
        `${TRAFFIC_BASE}?property_id=igihe-en&${query}`
      )
      const posts = await response.json()
      return Array.isArray(posts.articles) ? posts.articles : []
    },
    getContentDate: (posts) => (posts.length > 0 ? posts[0].date : null),
  })
}

export async function fetchPopularArticlesByCategory(
  categoryId: number,
  params?: {
    period?: 'day' | 'week' | 'month' | 'all'
    per_page?: number
    page?: number
  }
) {
  const defaults = { period: 'all', per_page: 5, page: 1, ...params }

  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries({
        categories: categoryId.toString(),
        orderby: 'popularity',
        order: 'desc',
        ...defaults,
      }).map(([k, v]) => [k, String(v)])
    )
  )

  const response = await fetchWithTimeout(
    `${API_CONFIG.baseURL}/popular-posts?category_id=${categoryId}&${query}&_embed=1`
  )
  return response.json()
}

export async function fetchPopularArticlesByCategorySlug(
  slug: string,
  params?: {
    period?: 'day' | 'week' | 'month' | 'all'
    per_page?: number
    page?: number
  }
) {
  const defaults = { period: 'week', per_page: 5, page: 1, ...params }

  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries({
        category_slug: slug,
        orderby: 'popularity',
        order: 'desc',
        ...defaults,
      }).map(([k, v]) => [k, String(v)])
    )
  )

  const response = await fetchWithTimeout(
    `${API_CONFIG.baseURL}/posts?_embed&${query}`
  )
  return response.json()
}

export async function fetchPopularPosts(params?: {
  per_page?: number
  days?: number
}): Promise<NewsItem[]> {
  const queryParams: Record<string, any> = {
    per_page: params?.per_page || 10,
    orderby: 'comment_count',
    order: 'desc',
    _embed: '1',
    _fields: ['id', 'slug', 'title', 'date', 'comment_count', 'featured_media', '_embedded'].join(','),
  }

  if (params?.days) {
    const d = new Date()
    d.setDate(d.getDate() - params.days)
    queryParams.after = d.toISOString()
  }

  return cachedRequest({
    key: `popular:${JSON.stringify(queryParams)}`,
    fetchFn: async () => {
      const { buildQuery } = await import('./apiClient')
      const qs = buildQuery(queryParams)
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/posts?${qs}`)
      return response.json()
    },
    ttl: 15 * 60 * 1000,
  })
}
