
import { AdPositionKey, getAdsByPosition } from '@/lib/adPositions';
import { Advertisement, articleResponse, Author, AuthorWithPosts, Category, CategoryPostsResponse, NewsItem } from '@/types/fetchData'

// Configuration
const API_CONFIG = {
  // baseURL: process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
  baseURL: process.env.NODE_ENV === 'production' ? '/api/proxy' : process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
  timeout: 20000, // 10 seconds
  retryAttempts: 3,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 100,
}

class LRUCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private readonly maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get(key: string): { data: T; timestamp: number } | undefined {
    const item = this.cache.get(key)
    if (item) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, item)
    }
    return item
  }

  set(key: string, value: { data: T; timestamp: number }): void {
    // Remove if exists (to re-add at end)
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey)
        this.cache.delete(firstKey)
    }

    this.cache.set(key, value)
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }
}

const requestCache = new LRUCache<any>(API_CONFIG.maxCacheSize)
const inFlightRequests = new Map<string, Promise<any>>()


const rateLimit = {
  requests: new Map<string, number[]>(),
  check: (key: string, maxRequests: number = 100, windowMs: number = 60000) => {
    const now = Date.now()
    const windowStart = now - windowMs
    const requests = rateLimit.requests.get(key) || []
    const recentRequests = requests.filter(time => time > windowStart)

    if (recentRequests.length >= maxRequests) {
      throw new Error('Rate limit exceeded')
    }

    recentRequests.push(now)
    rateLimit.requests.set(key, recentRequests)
    return true
  }
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

const pendingRequests = new Map<string, Promise<any>>()

export class ApiService {

  static getCachedArticle(cacheKey: string): NewsItem | null {
    const cached = requestCache.get(cacheKey);
    // console.log('cacheKey',cacheKey)
    // console.log('cached',cached)
    if (cached) {
      console.log('API Cache hit for:', cacheKey);
      return cached.data;
    }
    return null;
  }



  static cacheArticles(article: NewsItem): void {
    if (article?.slug) {
      const cacheKey = `post:${article.slug}`
      if (pendingRequests.has(cacheKey)) {
        return
      }
      try {
        requestCache.set(cacheKey, { data: article, timestamp: Date.now() })
      } catch (error) {
        // sessionStorage might be full, that's ok
        console.debug('Failed to store in sessionStorage:', error)
      }
    }
  }


  private static async dedupedFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    ttl: number = API_CONFIG.cacheTimeout
  ): Promise<T> {
    const now = Date.now()
    const cached = requestCache.get(cacheKey)

    // Return cached data if not expired
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data
    }

    // Check if same request is already in flight
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey)!
    }

    // Rate limiting check
    rateLimit.check('api_requests', 100, 60000)

    try {
      const requestPromise = fetchFn()
      pendingRequests.set(cacheKey, requestPromise)
      const data = await requestPromise
      // Cache the successful response
      requestCache.set(cacheKey, { data, timestamp: now })

      return data
    } catch (error) {
      // On error, return cached data even if expired (stale-while-revalidate)
      if (cached) {
        console.warn('Using stale cache due to API error:', error)
        return cached.data
      }
      throw error
    } finally {
      // Always remove from pending requests
      pendingRequests.delete(cacheKey)
    }
  }



  // private static async fetchWithTimeout(
  //   url: string,
  //   options: RequestInit = {},
  //   timeout = API_CONFIG.timeout
  // ) {
  //   const controller = new AbortController();
  //   const id = setTimeout(() => controller.abort(), timeout);

  //   try {
  //     const response = await fetch(url, {
  //       ...options,
  //       signal: controller.signal,
  //       headers: {
  //         'Accept': 'application/json',
  //         'Content-Type': 'application/json',
  //         ...options.headers,
  //       },
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     return response;
  //   } catch (error) {
  //     if (controller.signal.aborted) {
  //       throw new Error("Request timed out");
  //     }
  //     throw error;
  //   } finally {
  //     clearTimeout(id); // ALWAYS clear
  //   }
  // }

  private static async fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = API_CONFIG.timeout
) {
  let lastError: Error | null = null;
  const maxRetries = API_CONFIG.retryAttempts || 2;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(id);

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        const status = response.status;
        
        // Check if we should retry
        const shouldRetry = 
          attempt < maxRetries && (
            status === 429 || // Too Many Requests - retry after backoff
            status >= 500 ||  // Server errors - retry
            status === 408 || // Request Timeout - retry
            status === 0      // Network error - retry
          );
        
        if (shouldRetry) {
          lastError = error;
          // Calculate exponential backoff: 1s, 2s, 4s
          const backoffDelay = Math.pow(2, attempt) * 1000;
          console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${backoffDelay}ms...`, {
            url,
            status,
            error: error.message
          });
          
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue; // Try again
        }
        
        throw error; // Don't retry for client errors (4xx except 429)
      }

      return response;
    } catch (error: any) {
      clearTimeout(id);
      
      const isTimeout = controller.signal.aborted || error.message === "Request timed out" || error.name === 'AbortError';
      
      if (attempt < maxRetries) {
        lastError = error;
        
        // Calculate exponential backoff: 1s, 2s, 4s
        const backoffDelay = Math.pow(2, attempt) * 1000;
        console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${backoffDelay}ms...`, {
          url,
          error: error.message,
          isTimeout
        });
        
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue; // Try again
      }
      
      // No more retries
      if (isTimeout) {
        throw new Error(`Request timed out after ${maxRetries + 1} attempts`);
      }
      throw error;
    }
  }
  
  // This should never be reached, but just in case
  throw lastError || new Error(`Request failed after ${maxRetries + 1} attempts`);
}

  private static async cachedFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    ttl: number = API_CONFIG.cacheTimeout
  ): Promise<T> {
    const now = Date.now()
    const cached = requestCache.get(cacheKey)

    // Return cached data if not expired
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data
    }

    // Rate limiting check
    rateLimit.check('api_requests', 100, 60000)
    try {
      const data = await fetchFn()

      // Cache the successful response
      requestCache.set(cacheKey, { data, timestamp: now })

      return data
    } catch (error) {
      // On error, return cached data even if expired (stale-while-revalidate)
      if (cached) {
        console.warn('Using stale cache due to API error:', error)
        return cached.data
      }
      throw error
    }
  }

  private static buildQuery(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()))
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })

    return searchParams.toString()
  }

  private static buildPaginationResponse<T>(
    data: T[],
    response: Response,
    params: { page?: number; per_page?: number }
  ): articleResponse<T> {
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1')
    const totalItems = parseInt(response.headers.get('X-WP-Total') || '0')
    const currentPage = params.page || 1
    const perPage = params.per_page || 10

    return {
      data,
      pagination: {
        currentPage,
        perPage,
        totalPages,
        totalItems,
        hasNextPage: currentPage < totalPages
      }
    }
  }

  static async fetchPostBySlug(slug: string): Promise<NewsItem | null> {
    const cacheKey = `post:${slug}`

    return this.cachedFetch(cacheKey, async () => {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/posts?slug=${slug}&_embed=1`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const posts = await response.json()
      if (!Array.isArray(posts) || posts.length === 0) {
        return null
      }
      return posts[0]
    }, 10 * 60 * 1000)
  }



  static async fetchMostPopularArticlesFallback(params?: {
    period?: 'day' | 'week' | 'month' | 'all'
    per_page?: number
    page?: number
  }): Promise<NewsItem[]> {
    const defaultParams = {
      period: 'week',
      per_page: 5,
      page: 1,
      ...params
    }

    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries({
          orderby: 'meta_value_num',
          order: 'desc',
          meta_key: 'pvt_views',
          ...defaultParams,
        }).map(([k, v]) => [k, String(v)])
      )
    )

    const cacheKey = `popular:fallback:${query}`

    return this.cachedFetch(cacheKey, async () => {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/pvt/v1/popular-posts?${query}&_embed=1`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const posts = await response.json()
      return Array.isArray(posts) ? posts : []
    }, 10 * 60 * 1000)
  }






  static async fetchMostPopularArticles(params?: {
    period?: 'day' | 'week' | 'month' | 'all'
    per_page?: number
    page?: number
  }): Promise<NewsItem[]> {
    const defaultParams = {
      period: 'week',
      per_page: 10,
      page: 1,
      ...params
    }

    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries({
          orderby: 'popularity',
          order: 'desc',
          ...defaultParams,
        }).map(([k, v]) => [k, String(v)])
      )
    )
    const cacheKey = `popular:${query}`

    return this.cachedFetch(cacheKey, async () => {
      const response = await this.fetchWithTimeout(`${API_CONFIG.baseURL}/pvt/v1/popular-posts?${query}&_embed=1`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const posts = await response.json()
      return Array.isArray(posts) ? posts : []
    }, 10 * 60 * 1000)

  }





  static async fetchPopularArticlesByCategory(categoryId: number, params?: {
    period?: 'day' | 'week' | 'month' | 'all'
    per_page?: number
    page?: number
  }) {
    const defaultParams = {
      period: 'all',
      per_page: 5,
      page: 1,
      ...params
    }
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries({
          categories: categoryId.toString(),
          orderby: 'popularity',
          order: 'desc',
          ...defaultParams,
        }).map(([k, v]) => [k, String(v)])
      )
    )
    // popular-posts?category_id=3&period=month&per_page=10"
    const response = await this.fetchWithTimeout(`${API_CONFIG.baseURL}/popular-posts?category_id=${categoryId}&${query}&_embed=1`)

    return response.json()
  }



  static async fetchPopularArticlesByCategorySlug(slug: string, params?: {
    period?: 'day' | 'week' | 'month' | 'all'
    per_page?: number
    page?: number
  }) {
    const defaultParams = {
      period: 'week',
      per_page: 5,
      page: 1,
      ...params
    }

    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries({
          category_slug: slug,
          orderby: 'popularity',
          order: 'desc',
          ...defaultParams,
        }).map(([k, v]) => [k, String(v)])
      )
    )
    const response = await this.fetchWithTimeout(`${API_CONFIG.baseURL}/posts?_embed&${query}`)

    return response.json()
  }




  // Categories API

  static async fetchCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/categories?slug=${slug}&_embed`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const categories = await response.json()

      // Return the first category or null if not found
      return categories[0] || null
    } catch (error) {
      console.error('Error fetching category by slug:', error)
      throw error
    }
  }



  static async fetchPostsByCategorySlug(
    slug: string,
    params?: {
      per_page?: number
      page?: number
      orderby?: 'date' | 'modified' | 'title' | 'comment_count'
      order?: 'asc' | 'desc'
    }
  ): Promise<CategoryPostsResponse | null> {
    try {
      const category = await this.fetchCategoryBySlug(slug)
      if (!category) {
        console.log('Category not found for slug:', slug)
        return null
      }
      const postsResponse = await this.fetchArticles({
        categories: [category.id],
        ...params
      })
      return {
        posts: postsResponse,
        category: category
      }
    } catch (error) {
      console.error('Error fetching posts by category slug:', error)
      return null
    }
  }


  static async fetchCategories(params?: any): Promise<Category[]> {
    const cacheKey = `categories:${JSON.stringify(params)}`

    return this.dedupedFetch(cacheKey, async () => {
      // Your existing categories fetch logic
      const queryParams: Record<string, any> = {
        per_page: params?.per_page || 100,
        _fields: 'id,name,slug,count,description',
        orderby: params?.orderby || 'count',
        order: 'desc',
      }

      if (params?.exclude?.length) {
        queryParams.exclude = params.exclude.join(',')
      }

      const queryString = this.buildQuery(queryParams)
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/categories?${queryString}`
      )

      const data = await response.json()
      return data.filter((category: Category) => category.count > 0)
    }, 30 * 60 * 1000) // 30 minutes cache for categories
  }

  // Articles/Posts API

  static async fetchArticles(params?: {
    page?: number
    per_page?: number
    categories?: number[]
    search?: string
    exclude?: number[]
    include?: number[]
    orderby?: 'date' | 'modified' | 'title' | 'comment_count' | 'relevance' | 'slug' | 'include' | 'id'
    order?: 'asc' | 'desc'
    after?: string
    before?: string,
    author?: number,
    tags?: number[]
  }): Promise<articleResponse<NewsItem>> {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      per_page: params?.per_page || 20,
      _embed: '1',
      orderby: params?.orderby || 'date',
      order: params?.order || 'desc',
    }

    if (params?.categories?.length) {
      queryParams.categories = params.categories.join(',')
    }
    if (params?.tags?.length) {
      queryParams.tags = params.tags.join(',')
    }

    if (params?.search) {
      queryParams.search = params.search
    }

    if (params?.exclude?.length) {
      queryParams.exclude = params.exclude.join(',')
    }

    if (params?.include?.length) {
      queryParams.include = params.include.join(',')
    }

    if (params?.after) {
      queryParams.after = params.after
    }

    if (params?.before) {
      queryParams.before = params.before
    }

    const cacheKey = `articles:${JSON.stringify(queryParams)}`

    return this.cachedFetch(cacheKey, async () => {
      const queryString = this.buildQuery(queryParams)

      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/posts?${queryString}`
      )
      const data = await response.json()
      return this.buildPaginationResponse(data, response, {
        page: params?.page,
        per_page: params?.per_page,
      })
    }, 2 * 60 * 1000) // 2 minutes cache for articles
  }

  // Videos API
  static async fetchVideos(params?: {
    page?: number
    per_page?: number
    search?: string
    exclude?: number[]
    include?: number[]
  }): Promise<NewsItem[]> {
    const queryParams: Record<string, any> = {
      page: params?.page,
      per_page: params?.per_page || 21,
      _embed: '1'
    }

    if (params?.search) {
      queryParams.search = params.search
    }

    if (params?.exclude?.length) {
      queryParams.exclude = params.exclude.join(',')
    }

    if (params?.include?.length) {
      queryParams.include = params.include.join(',')
    }

    const cacheKey = `videos:${JSON.stringify(queryParams)}`

    return this.cachedFetch(cacheKey, async () => {
      const queryString = this.buildQuery(queryParams)
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/igh-yt-videos?${queryString}`
      )

      return await response.json()
    }, 5 * 60 * 1000) // 5 minutes cache for videos
  }

  // Single Post/Article
  static async fetchSinglePost(id: string): Promise<NewsItem> {
    const cacheKey = `post:${id}`

    return this.cachedFetch(cacheKey, async () => {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/posts/${id}?_embed=1`
      )

      return await response.json()
    }, 10 * 60 * 1000) // 10 minutes cache for single posts
  }

  // Single Video
  static async fetchSingleVideo(id: string): Promise<NewsItem> {
    const cacheKey = `video:${id}`

    return this.cachedFetch(cacheKey, async () => {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/igh-yt-videos/${id}?_embed=1&_fields=${[
          'id', 'date', 'slug', 'title', 'acf', 'featured_media', '_embedded'
        ].join(',')}`
      )

      return await response.json()
    }, 10 * 60 * 1000) // 10 minutes cache for single videos
  }

  // Related Posts
  static async fetchRelatedPosts(postId: string, categories: number[], tags: number[] = []): Promise<NewsItem[]> {
    const queryParams: Record<string, any> = {
      per_page: 6,
      exclude: [postId],
      _embed: '1',
    }

    // Prioritize same category posts, then tag-based
    if (categories.length > 0) {
      queryParams.categories = categories.join(',')
    } else if (tags.length > 0) {
      queryParams.tags = tags.join(',')
    }

    const cacheKey = `related:${postId}:${JSON.stringify(queryParams)}`

    return this.cachedFetch(cacheKey, async () => {
      const queryString = this.buildQuery(queryParams)
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/posts?${queryString}`
      )

      const data = await response.json()

      // If no results, fall back to latest posts
      if (data.length === 0) {
        return this.fetchArticles({ per_page: 6 }).then(res => res.data)
      }

      return data || []
    })
  }

  // Popular Posts (based on comment count)
  static async fetchPopularPosts(params?: {
    per_page?: number
    days?: number // Popular in last X days
  }): Promise<NewsItem[]> {
    const queryParams: Record<string, any> = {
      per_page: params?.per_page || 10,
      orderby: 'comment_count',
      order: 'desc',
      _embed: '1',
      _fields: ['id', 'slug', 'title', 'date', 'comment_count', 'featured_media', '_embedded'].join(','),
    }

    if (params?.days) {
      const date = new Date()
      date.setDate(date.getDate() - params.days)
      queryParams.after = date.toISOString()
    }

    const cacheKey = `popular:${JSON.stringify(queryParams)}`

    return this.cachedFetch(cacheKey, async () => {
      const queryString = this.buildQuery(queryParams)
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/posts?${queryString}`
      )

      return await response.json()
    }, 15 * 60 * 1000) // 15 minutes cache for popular posts
  }

  // Search across posts and videos
  static async globalSearch(query: string, params?: {
    per_page?: number
    type?: 'all' | 'posts' | 'videos'
  }): Promise<{
    posts: NewsItem[]
    videos: NewsItem[]
  }> {
    if (query.length < 2) {
      return { posts: [], videos: [] }
    }

    const cacheKey = `search:${query}:${JSON.stringify(params)}`

    return this.cachedFetch(cacheKey, async () => {
      const [posts, videos] = await Promise.allSettled([
        params?.type !== 'videos' ?
          this.fetchArticles({
            search: query,
            per_page: params?.per_page || 20
          }).then(res => res.data) :
          Promise.resolve([]),

        params?.type !== 'posts' ?
          this.fetchVideos({
            search: query,
            per_page: params?.per_page || 20
          }) :
          Promise.resolve([])
      ])

      return {
        posts: posts.status === 'fulfilled' ? posts.value : [],
        videos: videos.status === 'fulfilled' ? videos.value : [],
      }
    }, 2 * 60 * 1000) // 2 minutes cache for search results
  }

  // Comments API
  static async fetchComments(postId: number, params?: {
    page?: number
    per_page?: number
    parent?: number
  }): Promise<any[]> {
    const queryParams: Record<string, any> = {
      post: postId,
      page: params?.page,
      per_page: params?.per_page || 100,
      order: 'asc',
    }

    if (params?.parent !== undefined) {
      queryParams.parent = params.parent
    }

    const cacheKey = `comments:${postId}:${JSON.stringify(queryParams)}`

    return this.cachedFetch(cacheKey, async () => {
      const queryString = this.buildQuery(queryParams)
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/comments?${queryString}`
      )

      return await response.json()
    })
  }

  static async submitComment(postId: number, comment: {
    author_name: string
    author_email: string
    content: string
    parent?: number
  }): Promise<any> {
    const response = await this.fetchWithTimeout(
      `${API_CONFIG.baseURL}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({
          post: postId,
          ...comment
        })
      }
    )

    // Invalidate comments cache for this post
    const cacheKeys = Array.from(requestCache.keys()).filter(key =>
      key.startsWith(`comments:${postId}`)
    )
    cacheKeys.forEach(key => requestCache.delete(key))

    return await response.json()
  }

  // Media API
  static async fetchMedia(mediaId: number): Promise<any> {
    const cacheKey = `media:${mediaId}`

    return this.cachedFetch(cacheKey, async () => {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/media/${mediaId}`
      )

      return await response.json()
    }, 60 * 60 * 1000) // 1 hour cache for media
  }

  // Batch requests for better performance
  static async batchRequests(requests: Array<{
    method: string;
    url: string;
    params?: Record<string, any>
  }>): Promise<any[]> {
    return Promise.allSettled(
      requests.map(async (request) => {
        switch (request.method) {
          case 'categories':
            return this.fetchCategories(request.params)
          case 'articles':
            return this.fetchArticles(request.params)
          case 'videos':
            return this.fetchVideos(request.params)
          case 'post':
            return this.fetchSinglePost(request.params?.id)
          case 'video':
            return this.fetchSingleVideo(request.params?.id)
          default:
            throw new Error(`Unknown method: ${request.method}`)
        }
      })
    ).then(results =>
      results.map(result =>
        result.status === 'fulfilled' ? result.value : null
      )
    )
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/`,
        {},
        5000 // 5 second timeout for health check
      )
      return response.ok
    } catch {
      return false
    }
  }

  // Clear cache (useful for development)
  static clearCache(pattern?: string) {
    if (pattern) {
      const keys = Array.from(requestCache.keys()).filter(key => key.includes(pattern))
      keys.forEach(key => requestCache.delete(key))
    } else {
      requestCache.clear()
    }
  }

  // Get cache statistics (for monitoring)
  // static getCacheStats() {
  //   const now = Date.now()
  //   const entries = Array.from(requestCache.entries())

  //   return {
  //     totalEntries: entries.length,
  //     expiredEntries: entries.filter(([_, value]) => 
  //       (now - value.timestamp) > API_CONFIG.cacheTimeout
  //     ).length,
  //     memoryUsage: JSON.stringify(entries).length,
  //   }
  // }


  static async fetchPopularCategories(limit: number = 10): Promise<Category[]> {
    try {
      const categories = await this.fetchCategories({
        per_page: limit,
        orderby: 'count',
      })

      return categories.filter(category => category.count > 0)
    } catch (error) {
      console.error('Error fetching popular categories:', error)
      return []
    }
  }



  static async fetchCategoriesWithPosts(limit: number = 20): Promise<Array<Category & { recent_posts: NewsItem[] }>> {
    try {
      const categories = await this.fetchPopularCategories(limit)

      const categoriesWithPosts = await Promise.all(
        categories.map(async (category) => {
          try {
            const postsResponse = await this.fetchArticles({
              categories: [category.id],
              per_page: 5, // Get 5 recent posts for each category
              orderby: 'date',
              order: 'desc'
            })

            return {
              ...category,
              recent_posts: postsResponse.data || []
            }
          } catch (error) {
            console.error(`Error fetching posts for category ${category.name}:`, error)
            return {
              ...category,
              recent_posts: []
            }
          }
        })
      )

      return categoriesWithPosts
    } catch (error) {
      console.error('Error fetching categories with posts:', error)
      return []
    }
  }

  static async fetchAuthorBySlug(slug: string): Promise<Author | null> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.baseURL}/users?slug=${slug}&_embed`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const authors = await response.json()
      return authors[0] || null
    } catch (error) {
      console.error('Error fetching author by slug:', error)
      throw error
    }
  }

  static async fetchAuthorById(id: number): Promise<Author | null> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.baseURL}/users/${id}?_embed`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const author = await response.json()
      return author || null
    } catch (error) {
      console.error('Error fetching author by ID:', error)
      throw error
    }
  }
private static authorFetchPromises = new Map<string, Promise<Author | null>>();



static async fetchPostsByAuthorSlug(
  slug: string,
  params?: {
    per_page?: number
    page?: number
  }
): Promise<{ data: NewsItem[]; author: Author | null; pagination?: any }> {
  try {
    // Use promise deduplication to prevent race conditions
    let authorPromise = this.authorFetchPromises.get(slug);
    
    if (!authorPromise) {
      authorPromise = this.fetchAuthorBySlug(slug).finally(() => {
        // Clean up after completion
        this.authorFetchPromises.delete(slug);
      });
      this.authorFetchPromises.set(slug, authorPromise);
    }
    
    const author = await authorPromise;
    
    if (!author) {
      console.warn(`Author with slug "${slug}" not found`);
      return { data: [], author: null, pagination: null };
    }

    // Also deduplicate article fetches
    const cacheKey = `author-posts:${slug}:${JSON.stringify(params || {})}`;
    const postsResponse = await this.cachedFetch(cacheKey, async () => {
      return await this.fetchArticles({
        author: author.id,
        ...params
      });
    }, 60 * 1000); // 1 minute cache for author posts

    return {
      data: postsResponse?.data || [],
      author,
      pagination: postsResponse?.pagination
    };
  } catch (error) {
    console.error('Error fetching posts by author slug:', error);
    return { data: [], author: null, pagination: null };
  }
}

  static async fetchPostsByAuthorId(
    authorId: number,
    params?: {
      per_page?: number
      page?: number
      orderby?: string
      order?: 'asc' | 'desc'
    }
  ): Promise<NewsItem[]> {
    try {
      const postsResponse = await this.fetchArticles({
        author: authorId
      })

      return postsResponse.data || []
    } catch (error) {
      console.error('Error fetching posts by author ID:', error)
      return []
    }
  }


  /**
   * Fetch authors with recent posts
   */



  static async fetchAllAuthors(params?: {
    per_page?: number
    orderby?: string
    order?: 'asc' | 'desc'
  }): Promise<Author[]> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
      if (params?.orderby) queryParams.append('orderby', params.orderby)
      if (params?.order) queryParams.append('order', params.order)

      const response = await this.fetchWithTimeout(`${API_CONFIG.baseURL}/users?${queryParams}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const authors = await response.json()
      return authors || []
    } catch (error) {
      console.error('Error fetching all authors:', error)
      return []
    }
  }

  // static async fetchAuthorsWithPosts(limit: number = 10): Promise<AuthorWithPosts[]> {
  //   try {
  //     const authors = await this.fetchAllAuthors({ per_page: limit })

  //     const authorsWithPosts = await Promise.all(
  //       authors.map(async (author) => {
  //         try {
  //           const posts = await this.fetchPostsByAuthorId(author.id, { per_page: 3 })
  //           return {
  //             ...author,
  //             recent_posts: posts,
  //             total_posts: author.post_count || 0
  //           }
  //         } catch (error) {
  //           console.error(`Error fetching posts for author ${author.name}:`, error)
  //           return {
  //             ...author,
  //             recent_posts: [],
  //             total_posts: author.post_count || 0
  //           }
  //         }
  //       })
  //     )

  //     return authorsWithPosts
  //   } catch (error) {
  //     console.error('Error fetching authors with posts:', error)
  //     return []
  //   }
  // }





  static async fetchAdvertorals(): Promise<NewsItem[]> {
    const cacheKey = 'advertorial:all'

    try {
      return this.dedupedFetch(cacheKey, async () => {
        const response = await this.fetchWithTimeout(`${API_CONFIG.baseURL}/advertorial?_embed&per_page=50`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const ads = await response.json()
        return ads || []
      }, 10 * 60 * 1000) // 10 minutes cache for ads

    } catch (error) {
      console.error('Error fetching advertisements:', error)
      return []
    }
  }


  static async fetchOpinions(params?: {
    per_page?: number
    orderby?: string
    order?: 'asc' | 'desc'
  }): Promise<NewsItem[]> {

    const cacheKey = 'opinion:all'

    try {
      return this.dedupedFetch(cacheKey, async () => {
        const queryParams = new URLSearchParams()
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
        if (params?.orderby) queryParams.append('orderby', params.orderby)
        if (params?.order) queryParams.append('order', params.order)

        const response = await this.fetchWithTimeout(`${API_CONFIG.baseURL}/opinion?_embed&${queryParams}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const ads = await response.json()
        return ads || []
      }, 10 * 60 * 1000) // 10 minutes cache for ads
    } catch (error) {
      console.error('Error fetching advertisements:', error)
      return []
    }
  }


  static async fetchFacts(params?: {
    per_page?: number
    orderby?: string
    order?: 'asc' | 'desc'
  }): Promise<NewsItem[]> {
    const cacheKey = 'fact-of-the-day:all'
    try {
      return this.dedupedFetch(cacheKey, async () => {
        const queryParams = new URLSearchParams()
        if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
        if (params?.orderby) queryParams.append('orderby', params.orderby)
        if (params?.order) queryParams.append('order', params.order)

        const response = await this.fetchWithTimeout(`${API_CONFIG.baseURL}/fact-of-the-day?_embed&${queryParams}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const ads = await response.json()
        return ads || []
      }, 10 * 60 * 1000) // 10 minutes cache for ads
    } catch (error) {
      console.error('Error fetching advertisements:', error)
      return []
    }
  }



  static async fetchAnnouncement(): Promise<NewsItem[]> {
    const cacheKey = 'announcement:all'
    try {
      return this.dedupedFetch(cacheKey, async () => {
        const response = await this.fetchWithTimeout(`${API_CONFIG.baseURL}/announcement?_embed&per_page=50`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const ads = await response.json()
        return ads || []
      }, 10 * 60 * 1000) // 10 minutes cache for ads
    } catch (error) {
      console.error('Error fetching advertisements:', error)
      return []
    }
  }







  static async fetchAdvertisements(): Promise<Advertisement[]> {
    const cacheKey = 'advertisements:all'

    return this.dedupedFetch(cacheKey, async () => {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/advertisement?status=publish&per_page=100&_embed`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const ads = await response.json()
      return ads || []
    }, 10 * 60 * 1000) // 10 minutes cache for ads
  }

  static async fetchAdsByPosition(position: AdPositionKey): Promise<Advertisement[]> {
    const cacheKey = `advertisements:${position}`
    try {
      return this.dedupedFetch(cacheKey, async () => {
        const ads = await this.fetchAdvertisements()
        return getAdsByPosition(ads, position)
      }, 10 * 60 * 1000)
    } catch (error) {
      console.error('Error fetching ads by position:', error)
      return []
    }
  }

  static async fetchAdsByPositions(positions: AdPositionKey[]): Promise<Record<AdPositionKey, Advertisement[]>> {
    const cacheKey = `advertisements:${positions}`
    try {
      return this.dedupedFetch(cacheKey, async () => {
        const ads = await this.fetchAdvertisements()
        const result: Record<AdPositionKey, Advertisement[]> = {} as any

        positions.forEach(position => {
          result[position] = getAdsByPosition(ads, position)
        })

        return result
      }, 10 * 60 * 1000)
    } catch (error) {
      console.error('Error fetching ads by positions:', error)
      return {} as Record<AdPositionKey, Advertisement[]>
    }
  }


}