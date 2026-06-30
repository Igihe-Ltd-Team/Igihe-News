import { AdPositionKey, getAdsByPosition } from '@/lib/adPositions'
import { Advertisement, Author, Byline, NewsItem } from '@/types/fetchData'
import { API_CONFIG, fetchWithTimeout, buildQuery } from './apiClient'
import { cachedRequest } from './cacheManager'
import { fetchArticles } from './articleService'

// ─── Videos ──────────────────────────────────────────────────────────────────

export async function fetchVideos(params?: {
  page?: number
  per_page?: number
  search?: string
  exclude?: number[]
  include?: number[]
}): Promise<NewsItem[]> {
  const queryParams: Record<string, any> = {
    page: params?.page,
    per_page: params?.per_page || 21,
    _embed: '1',
  }
  if (params?.search) queryParams.search = params.search
  if (params?.exclude?.length) queryParams.exclude = params.exclude.join(',')
  if (params?.include?.length) queryParams.include = params.include.join(',')

  return cachedRequest({
    key: `videos:${JSON.stringify(queryParams)}`,
    fetchFn: async () => {
      const qs = buildQuery(queryParams)
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/igh-yt-videos?${qs}`)
      return response.json()
    },
    ttl: 5 * 60 * 1000,
  })
}

export async function fetchSingleVideo(id: string): Promise<NewsItem> {
  return cachedRequest({
    key: `video:${id}`,
    fetchFn: async () => {
      const response = await fetchWithTimeout(
        `${API_CONFIG.baseURL}/igh-yt-videos/${id}?_embed=1&_fields=${[
          'id', 'date', 'slug', 'title', 'acf', 'featured_media', '_embedded',
        ].join(',')}`
      )
      return response.json()
    },
    ttl: 10 * 60 * 1000,
  })
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function fetchComments(
  postId: number,
  params?: { page?: number; per_page?: number; parent?: number }
): Promise<any[]> {
  const queryParams: Record<string, any> = {
    post: postId,
    page: params?.page,
    per_page: params?.per_page || 100,
    order: 'asc',
  }
  if (params?.parent !== undefined) queryParams.parent = params.parent

  return cachedRequest({
    key: `comments:${postId}:${JSON.stringify(queryParams)}`,
    fetchFn: async () => {
      const qs = buildQuery(queryParams)
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/comments?${qs}`)
      return response.json()
    },
  })
}

export async function submitComment(
  postId: number,
  comment: { author_name: string; author_email: string; content: string; parent?: number }
): Promise<any> {
  const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/comments`, {
    method: 'POST',
    body: JSON.stringify({ post: postId, ...comment }),
  })

  // Invalidate comments cache
  const { memoryCache } = await import('./cacheManager')
  memoryCache.keys()
    .filter(k => k.startsWith(`comments:${postId}`))
    .forEach(k => memoryCache.delete(k))

  return response.json()
}

// ─── Media ───────────────────────────────────────────────────────────────────

export async function fetchMedia(mediaId: number): Promise<any> {
  return cachedRequest({
    key: `media:${mediaId}`,
    fetchFn: async () => {
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/media/${mediaId}`)
      return response.json()
    },
    ttl: 60 * 60 * 1000,
  })
}

// ─── Advertisements ──────────────────────────────────────────────────────────

const ADS_CACHE_TTL = 5 * 60 * 1000
let adsFetchInProgress: Promise<Advertisement[]> | null = null
let lastGoodAds: Advertisement[] = []

export function clearAdsCache(): void {
  adsFetchInProgress = null
  lastGoodAds = []
}

async function fetchAdsFromWordPress(): Promise<Advertisement[]> {
  const url = `${API_CONFIG.baseURL}/advertisement?status=publish&per_page=100&_embed`

  if (typeof window === 'undefined') {
    // Server: use Next.js data cache with tag so revalidateTag('advertisements') works
    // across all workers in production — no custom memory/file cache involved here.
    const response = await fetch(url, {
      next: { tags: ['advertisements'], revalidate: 300 },
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return (await response.json()) || []
  }

  // Client: route through the BFF proxy (CORS) with no-cache to always get fresh data
  const response = await fetchWithTimeout(url, { cache: 'no-store' } as RequestInit)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return (await response.json()) || []
}

export async function fetchAdvertisements(): Promise<Advertisement[]> {
  if (adsFetchInProgress) return adsFetchInProgress

  adsFetchInProgress = fetchAdsFromWordPress()
    .then((ads) => {
      lastGoodAds = ads
      return ads
    })
    .catch((error) => {
      console.error('Error fetching advertisements:', error)
      return lastGoodAds
    })
    .finally(() => {
      adsFetchInProgress = null
    })

  return adsFetchInProgress
}

export async function fetchAdsByPosition(position: AdPositionKey): Promise<Advertisement[]> {
  try {
    if (typeof window === 'undefined') {
      // Server: go directly through fetchAdvertisements which uses Next.js's tagged data cache.
      // Skipping the per-worker memory cache here is intentional — it is what was causing stale
      // ads to persist in production even after revalidateTag('advertisements') was called.
      const allAds = await fetchAdvertisements()
      return getAdsByPosition(allAds, position)
    }

    // Client: use per-browser memory cache for dedup within the page lifetime.
    // The underlying fetchAdvertisements routes through the BFF proxy whose cache
    // is cleared by the revalidate endpoint.
    return cachedRequest({
      key: `slots:${position}`,
      fetchFn: async () => {
        const allAds = await fetchAdvertisements()
        return getAdsByPosition(allAds, position)
      },
      ttl: ADS_CACHE_TTL,
      dedup: true,
    })
  } catch (error) {
    console.error(`Error fetching ads for position ${position}:`, error)
    return []
  }
}


export async function getSlotFresh(position: AdPositionKey) {
  try {
    // Direct API call without cache
    const response = await fetch(
      `${API_CONFIG.baseURL}/advertisement?status=publish&per_page=100&_embed&_nocache=${Date.now()}`,
      { cache: 'no-store' }
    )
    const ads = await response.json()
    return getAdsByPosition(ads, position)
  } catch (error) {
    console.error('Error fetching fresh ads:', error)
    return []
  }
}

export async function fetchAdsByPositions(
  positions: AdPositionKey[]
): Promise<Record<AdPositionKey, Advertisement[]>> {
  try {
    const allAds = await fetchAdvertisements()
    const result = {} as Record<AdPositionKey, Advertisement[]>
    positions.forEach(pos => { result[pos] = getAdsByPosition(allAds, pos) })
    return result
  } catch {
    return {} as Record<AdPositionKey, Advertisement[]>
  }
}

// ─── Authors ─────────────────────────────────────────────────────────────────

export async function fetchAuthorBySlug(slug: string): Promise<Byline | null> {
  const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/byline?slug=${slug}&_embed`)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  const authors = await response.json()
  return authors[0] || null
}

export async function fetchAuthorById(id: number): Promise<Author | null> {
  const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/bylines/${id}?_embed`)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return (await response.json()) || null
}

const authorFetchPromises = new Map<string, Promise<Author | null>>()

export async function fetchPostsByAuthorSlug(
  slug: string,
  params?: { per_page?: number; page?: number }
): Promise<{ data: NewsItem[]; author: Author | null; pagination?: any }> {
  try {
    let authorPromise = authorFetchPromises.get(slug)
    if (!authorPromise) {
      authorPromise = fetchAuthorBySlug(slug).finally(() => {
        authorFetchPromises.delete(slug)
      })
      authorFetchPromises.set(slug, authorPromise)
    }

    const author = await authorPromise
    if (!author) return { data: [], author: null, pagination: null }

    const postsResponse = await cachedRequest({
      key: `author-posts:${slug}:${JSON.stringify(params || {})}`,
      fetchFn: () => fetchArticles({ author: author.id, ...params }),
      ttl: 60 * 1000,
    })

    return {
      data: postsResponse?.data || [],
      author,
      pagination: postsResponse?.pagination,
    }
  } catch (error) {
    console.error('Error fetching posts by author slug:', error)
    return { data: [], author: null, pagination: null }
  }
}

export async function fetchPostsByAuthorId(
  authorId: number,
  params?: { per_page?: number; page?: number; orderby?: string; order?: 'asc' | 'desc' }
): Promise<NewsItem[]> {
  try {
    const postsResponse = await fetchArticles({ author: authorId })
    return postsResponse.data || []
  } catch {
    return []
  }
}

export async function fetchAllAuthors(params?: {
  page?:number
  per_page?: number
  orderby?: string
  order?: 'asc' | 'desc'
}): Promise<Author[]> {
  try {
    const qp = new URLSearchParams()

    if (params?.page) qp.append('page',params?.page.toString())
    if (params?.per_page) qp.append('per_page', params.per_page.toString())
    if (params?.orderby) qp.append('orderby', params.orderby)
    if (params?.order) qp.append('order', params.order)

    const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/byline?${qp}`)
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return (await response.json()) || []
  } catch {
    return []
  }
}
