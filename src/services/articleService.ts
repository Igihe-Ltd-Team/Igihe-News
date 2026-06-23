import { fileCache } from '@/lib/cache/fileCache'
import { NewsItem, articleResponse } from '@/types/fetchData'
import { API_CONFIG, fetchWithTimeout, buildQuery, buildPaginationResponse } from './apiClient'
import {
  cachedRequest,
  cacheArticlesFromList,
  memoryCache,
  pendingRequests,
  clearCache,
  getCachedArticle,
  calculateArticleCacheTTL,
  calculateListCacheTTL,
  CACHE_CONFIG,
} from './cacheManager'

// ─── Single Article ──────────────────────────────────────────────────────────

export async function fetchPostBySlug(slug: string): Promise<NewsItem | null> {
  return cachedRequest({
    key: `post:${slug}`,
    fetchFn: async () => {
      const response = await fetchWithTimeout(
        `${API_CONFIG.baseURL}/posts?slug=${slug}&_embed=1`
      )
      const posts = await response.json()
      return Array.isArray(posts) && posts.length > 0 ? posts[0] : null
    },
    getContentDate: (data) => data?.date || null,
  })
}

export async function customPostFetch(apiUrl: string, slug: string): Promise<NewsItem | null> {
  return cachedRequest({
    key: `post:${slug}`,
    fetchFn: async () => {
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/${apiUrl}`)
      const posts = await response.json()
      return Array.isArray(posts) && posts.length > 0 ? posts[0] : null
    },
    getContentDate: (data) => data?.date || null,
  })
}

export async function fetchSinglePost(id: string): Promise<NewsItem> {
  return cachedRequest({
    key: `post:${id}`,
    fetchFn: async () => {
      const response = await fetchWithTimeout(
        `${API_CONFIG.baseURL}/posts/${id}?_embed=1`
      )
      return response.json()
    },
    getContentDate: (data) => data?.date || null,
  })
}

// ─── Article Lists ───────────────────────────────────────────────────────────



export async function fetchPostBySlugLookUp(slug: string): Promise<NewsItem | null> {
  // Define the order of priority for checking endpoints
  const endpoints = ['posts', 'opinion', 'advertorial', 'announcement'];

  return cachedRequest({
    key: `slug-lookup:${slug}`, // Changed key to be generic since it could be any type
    fetchFn: async () => {
      try {
        // Loop through each endpoint until an article is found
        for (const endpoint of endpoints) {
          const response = await fetchWithTimeout(
            `${API_CONFIG.baseURL}/${endpoint}?slug=${slug}&_embed=1`
          );
          
          if (!response.ok) continue; // Skip to next endpoint if request fails

          const data = await response.json();
          
          if (Array.isArray(data) && data.length > 0) {
            return data[0]; // Return the first match found and exit the loop
          }
        }
        
        return null; // Return null if no match was found in any endpoint
      } catch (error) {
        console.error(`Error fetching slug ${slug}:`, error);
        return null;
      }
    },
    getContentDate: (data) => data?.date || null,
  })
}



export async function fetchPostByIdLookUp(id: string): Promise<NewsItem | null> {
  const endpoints = ['posts', 'opinion', 'advertorial', 'announcement'];

  return cachedRequest({
    key: `id-lookup:${id}`,
    fetchFn: async () => {
      for (const endpoint of endpoints) {
        try {
          const response = await fetchWithTimeout(
            `${API_CONFIG.baseURL}/${endpoint}/${id}`
          );

          const data = await response.json();
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return Array.isArray(data) && data.length > 0 ? data[0] : data

        } catch (error) {
          continue;
        }
      }

      return null; // No match found across all endpoints
    },
    getContentDate: (data) => data?.date || null,
  });
}



export async function fetchArticles(params?: {
  page?: number
  per_page?: number
  categories?: number[]
  search?: string
  exclude?: number[]
  include?: number[]
  orderby?: 'date' | 'modified' | 'title' | 'comment_count' | 'relevance' | 'slug' | 'include' | 'id'
  order?: 'asc' | 'desc'
  after?: string
  before?: string
  author?: number
  bylines?:number
  user?: number
  tags?: number[]
  offset?:number
  tags_exclude?:number[]
  categories_exclude?:number[]
  _fields?:string
}): Promise<articleResponse<NewsItem>> {
  const queryParams: Record<string, any> = {
    page: params?.page || 1,
    per_page: params?.per_page || 20,
    _embed: '1',
    orderby: params?.orderby || 'date',
    order: params?.order || 'desc',
  }

  if (params?.categories?.length) queryParams.categories = params.categories.join(',')
  if (params?.tags?.length) queryParams.tags = params.tags.join(',')
  if (params?.search) queryParams.search = params.search
  if (params?._fields) queryParams._fields = params._fields
  if (params?.exclude?.length) queryParams.exclude = params.exclude.join(',')
  if (params?.include?.length) queryParams.include = params.include.join(',')
  if (params?.tags_exclude?.length) queryParams.tags_exclude = params.tags_exclude.join(',')
  if (params?.categories_exclude?.length) queryParams.categories_exclude = params.categories_exclude.join(',')
  if (params?.after) queryParams.after = params.after
  if (params?.before) queryParams.before = params.before
  if (params?.author) queryParams.author = params.author
  if (params?.user) queryParams.user = params.user
  if (params?.bylines) queryParams.byline = params.bylines
  if (params?.offset) queryParams.offset = params.offset
  

  const cacheKey = `articles:${JSON.stringify(queryParams)}`
  const isFirstPage = !params?.page || params.page === 1
  const listTTL = calculateListCacheTTL(isFirstPage)


  

  return cachedRequest({
    key: cacheKey,
    fetchFn: async () => {
      const qs = buildQuery(queryParams)
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/posts?${qs}`)
      const data = await response.json()

      if (Array.isArray(data) && data.length > 0) {
        cacheArticlesFromList(data).catch(() => {})
      }

      return buildPaginationResponse(data, response, {
        page: params?.page,
        per_page: params?.per_page,
      })
    },
    getContentDate: (res) => res?.data?.[0]?.date ?? null,
    ttl: listTTL,
  })
}

export async function fetchOtherPosts(params?: {
  postType: string
  page?: number
  per_page?: number
  categories?: number[]
  search?: string
  exclude?: number[]
  include?: number[]
  orderby?: 'date' | 'modified' | 'title' | 'comment_count' | 'relevance' | 'slug' | 'include' | 'id'
  order?: 'asc' | 'desc'
  after?: string
  before?: string
  author?: number
  tags?: number[]
}): Promise<articleResponse<NewsItem>> {
  const queryParams: Record<string, any> = {
    page: params?.page || 1,
    per_page: params?.per_page || 20,
    _embed: '1',
    orderby: params?.orderby || 'date',
    order: params?.order || 'desc',
  }

  if (params?.categories?.length) queryParams.categories = params.categories.join(',')
  if (params?.tags?.length) queryParams.tags = params.tags.join(',')
  if (params?.search) queryParams.search = params.search
  if (params?.exclude?.length) queryParams.exclude = params.exclude.join(',')
  if (params?.include?.length) queryParams.include = params.include.join(',')
  if (params?.after) queryParams.after = params.after
  if (params?.before) queryParams.before = params.before
  if (params?.author) queryParams.author = params.author

  const cacheKey = `${params?.postType}:${JSON.stringify(queryParams)}`
  const isFirstPage = !params?.page || params.page === 1
  const listTTL = calculateListCacheTTL(isFirstPage)

  // return cachedRequest({
  //   key: cacheKey,
  //   fetchFn: async () => {
  //     const qs = buildQuery(queryParams)
  //     const response = await fetchWithTimeout(
  //       `${API_CONFIG.baseURL}/${params?.postType}?${qs}`
  //     )
  //     const data = await response.json()

  //     if (Array.isArray(data) && data.length > 0) {
  //       cacheArticlesFromList(data).catch(() => {})
  //     }

  //     return buildPaginationResponse(data, response, {
  //       page: params?.page,
  //       per_page: params?.per_page,
  //     })
  //   },
  //   getContentDate: (res) => res?.data?.[0]?.date ?? null,
  //   ttl: listTTL,
  // })





  return cachedRequest({
    key: cacheKey,
    fetchFn: async () => {
      const qs = buildQuery(queryParams)
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/${params?.postType}?${qs}`)
      const data = await response.json()

      if (Array.isArray(data) && data.length > 0) {
        cacheArticlesFromList(data).catch(() => { })
      }

      return buildPaginationResponse(data, response, {
        page: params?.page,
        per_page: params?.per_page,
      })
    },
    getContentDate: (res) => res?.data?.[0]?.date ?? null,
    ttl: listTTL,
  })
}

// ─── Related Posts ───────────────────────────────────────────────────────────

export async function fetchRelatedPosts(
  postId: string,
  categories: number[],
  tags: number[] = []
): Promise<NewsItem[]> {
  const queryParams: Record<string, any> = {
    per_page: 6,
    exclude: [postId],
    _embed: '1',
  }



  if (categories.length > 0) {
    queryParams.categories = categories.join(',')
  } else if (tags.length > 0) {
    queryParams.tags = tags.join(',')
  }

  const qs = buildQuery(queryParams)
  const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/posts?${qs}`)
  const data = await response.json()

  if (data.length === 0) {
    return fetchArticles({ per_page: 6 }).then(res => res.data)
  }

  return data || []
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function globalSearch(
  query: string,
  params?: { per_page?: number; type?: 'all' | 'posts' | 'videos' }
): Promise<{ posts: NewsItem[]; videos: NewsItem[] }> {
  if (query.length < 2) return { posts: [], videos: [] }

  const { fetchVideos } = await import('./mediaService')

  return cachedRequest({
    key: `search:${query}:${JSON.stringify(params)}`,
    fetchFn: async () => {
      const [posts, videos] = await Promise.allSettled([
        params?.type !== 'videos'
          ? fetchArticles({ search: query, per_page: params?.per_page || 20 }).then(r => r.data)
          : Promise.resolve([]),
        params?.type !== 'posts'
          ? fetchVideos({ search: query, per_page: params?.per_page || 20 })
          : Promise.resolve([]),
      ])

      return {
        posts: posts.status === 'fulfilled' ? posts.value : [],
        videos: videos.status === 'fulfilled' ? videos.value : [],
      }
    },
    ttl: 2 * 60 * 1000,
  })
}

// ─── Opinions & Advertorials ─────────────────────────────────────────────────

export async function fetchOpinions(params?: {
  page?: number
  per_page?: number
  orderby?: string
  order?: 'asc' | 'desc'
}): Promise<articleResponse<NewsItem>> {
  const queryParams: Record<string, any> = {
    page: params?.page || 1,
    per_page: params?.per_page || 6,
    _embed: '1',
    orderby: params?.orderby || 'date',
    order: params?.order || 'desc',
  }

  return cachedRequest({
    key: `opinion:${JSON.stringify(queryParams)}`,
    fetchFn: async () => {
      const qs = buildQuery(queryParams)
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/opinion?${qs}`)
      const data = await response.json()

      if (Array.isArray(data) && data.length > 0) {
        cacheArticlesFromList(data).catch(() => {})
      }

      return buildPaginationResponse(data, response, {
        page: params?.page,
        per_page: params?.per_page,
      })
    },
    ttl: 5 * 60 * 1000,
  })
}

export async function fetchAdvertorials(params?: {
  page?: number
  per_page?: number
  orderby?: string
  order?: 'asc' | 'desc'
}): Promise<NewsItem[]> {
  const queryParams: Record<string, any> = {
    page: params?.page || 1,
    per_page: params?.per_page || 50,
    _embed: '1',
    orderby: params?.orderby || 'date',
    order: params?.order || 'desc',
  }

  return cachedRequest({
    key: `advertorial:${JSON.stringify(queryParams)}`,
    fetchFn: async () => {
      const qs = buildQuery(queryParams)
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/advertorial?${qs}`)
      const ads = await response.json()

      if (Array.isArray(ads) && ads.length > 0) {
        cacheArticlesFromList(ads).catch(() => {})
      }

      return ads || []
    },
    ttl: 10 * 60 * 1000,
  })
}

export async function fetchFacts(): Promise<NewsItem[]> {
  return cachedRequest({
    key: 'fact-of-the-day:all',
    fetchFn: async () => {
      const response = await fetchWithTimeout(
        `${API_CONFIG.baseURL}/fact-of-the-day?_embed&per_page=1`
      )
      return (await response.json()) || []
    },
    getContentDate: (data) => data?.[0]?.date || null,
  })
}

export async function fetchAnnouncements(): Promise<NewsItem[]> {
  return cachedRequest({
    key: 'announcement:all',
    fetchFn: async () => {
      const response = await fetchWithTimeout(
        `${API_CONFIG.baseURL}/announcement?_embed&per_page=50`
      )
      const announcements = await response.json()

      if (Array.isArray(announcements) && announcements.length > 0) {
        cacheArticlesFromList(announcements).catch(() => {})
      }

      return announcements || []
    },
    getContentDate: (data) => data?.[0]?.date || null,
  })
}

// ─── Article Refresh ─────────────────────────────────────────────────────────

export async function refreshArticle(slug: string, bypassCache = true): Promise<NewsItem | null> {
  // 1. Clear caches
  const cacheKey = `post:${slug}`
  memoryCache.delete(cacheKey)
  pendingRequests.delete(cacheKey)

  if (typeof window === 'undefined') {
    try { await fileCache.delete(cacheKey) } catch {}
  }

  // 2. Force-fetch
  const timestamp = bypassCache ? Date.now() : ''
  const url = `${API_CONFIG.baseURL}/posts?slug=${slug}&_embed=1${bypassCache ? `&_nocache=${timestamp}` : ''}`
  const response = await fetchWithTimeout(url)
  const posts = await response.json()

  if (!Array.isArray(posts) || posts.length === 0) return null
  const article = posts[0] as NewsItem

  // 3. Re-cache
  const ttl = calculateArticleCacheTTL(article.date)
  memoryCache.set(cacheKey, { data: article, timestamp: Date.now() })

  if (typeof window === 'undefined') {
    try { await fileCache.set(cacheKey, article, ttl, { contentDate: article.date }) } catch {}
  }

  // 4. Invalidate list caches that might reference this article
  const listPatterns = ['articles:', 'popular:', 'opinion:', 'advertorial:', 'announcement:']
  memoryCache.keys()
    .filter(k => listPatterns.some(p => k.startsWith(p)))
    .forEach(k => memoryCache.delete(k))

  return article
}

export async function refreshArticleById(id: number, bypassCache = true): Promise<NewsItem | null> {
  const response = await fetchWithTimeout(
    `${API_CONFIG.baseURL}/posts/${id}?_fields=slug${bypassCache ? `&_nocache=${Date.now()}` : ''}`
  )
  const post = await response.json()
  if (!post.slug) throw new Error(`No slug found for article ID: ${id}`)
  return refreshArticle(post.slug, bypassCache)
}

// Re-export for backward compatibility
export { getCachedArticle }
