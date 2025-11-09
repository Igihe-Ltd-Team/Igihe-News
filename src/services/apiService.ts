import { AdPositionKey, getAdsByPosition } from '@/lib/adPositions';
import { Advertisement, articleResponse, Author, AuthorWithPosts, Category, NewsItem } from '@/types/fetchData'

// Configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://your-wordpress-site.com/wp-json/wp/v2',
  timeout: 10000, // 10 seconds
  retryAttempts: 2,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
}

// Request cache for deduplication
const requestCache = new Map<string, { data: any; timestamp: number }>()

// Rate limiting
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

export class ApiService {
  private static async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = API_CONFIG.timeout) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(id)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response
    } catch (error) {
      clearTimeout(id)
      throw error
    }
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

  static async fetchPostBySlug(slug: string): Promise<NewsItem> {
    const response = await fetch(`${API_CONFIG.baseURL}/posts?slug=${slug}&_embed`)
    const posts = await response.json()
    return posts[0] || null // WordPress REST API returns array
  }
  

  // Categories API

  static async fetchCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}/categories?slug=${slug}&_embed`)
      
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
  ): Promise<{ data: NewsItem[]; category: Category | null }> {
    try {
      // First get the category by slug
      const category = await this.fetchCategoryBySlug(slug)
      
      if (!category) {
        return { data: [], category: null }
      }

      // Then fetch posts for this category
      const postsResponse = await this.fetchArticles({
        categories: [category.id],
        ...params
      })

      return {
        data: postsResponse.data || [],
        category
      }
    } catch (error) {
      console.error('Error fetching posts by category slug:', error)
      return { data: [], category: null }
    }
  }

static async fetchCategories(params?: {
    page?: number
    per_page?: number
    exclude?: number[]
    include?: number[]
    orderby?: 'id' | 'count' | 'name' | 'slug' | 'include' | 'term_group' // Make it optional
  }): Promise<Category[]> {
    const queryParams: Record<string, any> = {
      page: params?.page,
      per_page: params?.per_page || 100,
      _fields: 'id,name,slug,count,description',
      orderby: params?.orderby || 'count', // Use param or default to 'count'
      order: 'desc',
    }

    if (params?.exclude?.length) {
      queryParams.exclude = params.exclude.join(',')
    }

    if (params?.include?.length) {
      queryParams.include = params.include.join(',')
    }

    const cacheKey = `categories:${JSON.stringify(queryParams)}`

    return this.cachedFetch(cacheKey, async () => {
      const queryString = this.buildQuery(queryParams)
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.baseURL}/categories?${queryString}`
      )

      const data = await response.json()
      return data.filter((category: Category) => category.count > 0)
    }, 10 * 60 * 1000) // 10 minutes cache for categories
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
  before?: string
}): Promise<articleResponse<NewsItem>> {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      per_page: params?.per_page || 20,
      _embed: '1',
      // _fields: [
      //   'id',
      //   'date',
      //   'date_gmt',
      //   'modified',
      //   'modified_gmt',
      //   'slug',
      //   'status',
      //   'type',
      //   'link',
      //   'title',
      //   'content',
      //   'excerpt',
      //   'author',
      //   'featured_media',
      //   'categories',
      //   'tags',
      //   'acf',
      //   '_embedded'
      // ].join(','),
      orderby: params?.orderby || 'date',
      order: params?.order || 'desc',
    }

    if (params?.categories?.length) {
      queryParams.categories = params.categories.join(',')
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
        per_page: params?.per_page
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
      _embed: '1',
      _fields: [
        'id', 'date', 'slug', 'title', 'acf', 'featured_media', '_embedded'
      ].join(','),
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
        `${API_CONFIG.baseURL}/posts/${id}?_embed=1&_fields=${[
          'id',
          'date',
          'date_gmt',
          'modified',
          'modified_gmt',
          'slug',
          'status',
          'type',
          'link',
          'title',
          'content',
          'excerpt',
          'author',
          'featured_media',
          'categories',
          'tags',
          'acf',
          '_embedded'
        ].join(',')}`
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
      _fields: ['id', 'slug', 'title', 'date', 'featured_media', '_embedded'].join(','),
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
  static getCacheStats() {
    const now = Date.now()
    const entries = Array.from(requestCache.entries())
    
    return {
      totalEntries: entries.length,
      expiredEntries: entries.filter(([_, value]) => 
        (now - value.timestamp) > API_CONFIG.cacheTimeout
      ).length,
      memoryUsage: JSON.stringify(entries).length,
    }
  }


  static async fetchPopularCategories(limit: number = 10): Promise<Category[]> {
    try {
      const categories = await this.fetchCategories({
        per_page: limit,
        orderby: 'count',
        order: 'desc'
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
      const response = await fetch(`${API_CONFIG.baseURL}/users?slug=${slug}&_embed`)
      
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
      const response = await fetch(`${API_CONFIG.baseURL}/users/${id}?_embed`)
      
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



  static async fetchPostsByAuthorSlug(
    slug: string, 
    params?: {
      per_page?: number
      page?: number
      orderby?: string
      order?: 'asc' | 'desc'
    }
  ): Promise<{ data: NewsItem[]; author: Author | null }> {
    try {
      // First get the author by slug
      const author = await this.fetchAuthorBySlug(slug)
      
      if (!author) {
        console.warn(`Author with slug "${slug}" not found`)
        return { data: [], author: null }
      }

      // Then fetch posts for this author
      const postsResponse = await this.fetchArticles({
        author: author.id,
        ...params
      })

      // Ensure we always return a valid data structure
      return {
        data: postsResponse?.data || [],
        author
      }
    } catch (error) {
      console.error('Error fetching posts by author slug:', error)
      // Return empty data structure instead of throwing
      return { data: [], author: null }
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
        author: authorId,
        ...params
      })
      
      return postsResponse.data || []
    } catch (error) {
      console.error('Error fetching posts by author ID:', error)
      return []
    }
  }


  static async fetchPopularAuthors(limit: number = 10): Promise<Author[]> {
    try {
      const authors = await this.fetchAllAuthors({
        per_page: limit,
        orderby: 'count',
        order: 'desc'
      })

      return authors.filter(author => author.post_count > 0)
    } catch (error) {
      console.error('Error fetching popular authors:', error)
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

      const response = await fetch(`${API_CONFIG.baseURL}/users?${queryParams}`)
      
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

  static async fetchAuthorsWithPosts(limit: number = 10): Promise<AuthorWithPosts[]> {
    try {
      const authors = await this.fetchAllAuthors({ per_page: limit })
      
      const authorsWithPosts = await Promise.all(
        authors.map(async (author) => {
          try {
            const posts = await this.fetchPostsByAuthorId(author.id, { per_page: 3 })
            return {
              ...author,
              recent_posts: posts,
              total_posts: author.post_count || 0
            }
          } catch (error) {
            console.error(`Error fetching posts for author ${author.name}:`, error)
            return {
              ...author,
              recent_posts: [],
              total_posts: author.post_count || 0
            }
          }
        })
      )

      return authorsWithPosts
    } catch (error) {
      console.error('Error fetching authors with posts:', error)
      return []
    }
  }
  




  static async fetchAdvertisements(): Promise<Advertisement[]> {
    try {
      const response = await fetch(
        `${API_CONFIG.baseURL}/advertisement?status=publish&per_page=100&_fields=id,slug,title,menu_order,class_list,acf,link`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const ads = await response.json()
      return ads || []
    } catch (error) {
      console.error('Error fetching advertisements:', error)
      return []
    }
  }

  static async fetchAdsByPosition(position: AdPositionKey): Promise<Advertisement[]> {
    try {
      const ads = await this.fetchAdvertisements()
      return getAdsByPosition(ads, position)
    } catch (error) {
      console.error('Error fetching ads by position:', error)
      return []
    }
  }

  static async fetchAdsByPositions(positions: AdPositionKey[]): Promise<Record<AdPositionKey, Advertisement[]>> {
    try {
      const ads = await this.fetchAdvertisements()
      const result: Record<AdPositionKey, Advertisement[]> = {} as any
      
      positions.forEach(position => {
        result[position] = getAdsByPosition(ads, position)
      })
      
      return result
    } catch (error) {
      console.error('Error fetching ads by positions:', error)
      return {} as Record<AdPositionKey, Advertisement[]>
    }
  }

  
}