import { NextRequest, NextResponse } from 'next/server'

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://new.igihe.com/amirv2/wp-json/wp/v2'

// Enhanced cache with LRU eviction
class LRUCache {
  private cache: Map<string, CacheEntry>
  private maxSize: number

  constructor(maxSize = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    
    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry
  }

  set(key: string, value: CacheEntry): void {
    // Remove if exists (to re-add at end)
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey || '')
    }
    
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }
}

interface CacheEntry {
  data: any
  expiry: number
  etag?: string,
  _headers?:{
    wpTotal?:number | string | null
    wpTotalPages?:number | string | null
    link?:string | null
  }
}

const cache = new LRUCache(200) // Store up to 200 cached responses

// Cache TTL configuration by endpoint type
const CACHE_TTL = {
  posts: 120000,        // 2 minutes
  categories: 1800000,  // 30 minutes
  tags: 1800000,        // 30 minutes
  pages: 600000,        // 10 minutes
  media: 3600000,       // 1 hour
  popular: 300000,      // 5 minutes
  default: 300000       // 5 minutes
}

// Determine cache TTL based on path
function getCacheTTL(path: string[]): number {
  const pathStr = path.join('/')
  
  if (pathStr.includes('posts')) return CACHE_TTL.posts
  if (pathStr.includes('categories')) return CACHE_TTL.categories
  if (pathStr.includes('tags')) return CACHE_TTL.tags
  if (pathStr.includes('pages')) return CACHE_TTL.pages
  if (pathStr.includes('media')) return CACHE_TTL.media
  if (pathStr.includes('popular')) return CACHE_TTL.popular
  
  return CACHE_TTL.default
}

// Mock data for development
const mockData = {
  'posts': {
    data: [
      {
        id: 1,
        date: new Date().toISOString(),
        slug: 'sample-post-1',
        title: { rendered: 'Sample Post Title 1' },
        excerpt: { rendered: '<p>This is a sample excerpt for development purposes.</p>' },
        content: { rendered: '<p>This is sample content for development.</p>' },
        featured_media: 0,
        categories: [1],
        tags: [],
        _embedded: {
          author: [{ id: 1, name: 'Admin', slug: 'admin' }],
          'wp:featuredmedia': [],
          'wp:term': [[{ id: 1, name: 'News', slug: 'news' }]]
        }
      },
      {
        id: 2,
        date: new Date().toISOString(),
        slug: 'sample-post-2',
        title: { rendered: 'Sample Post Title 2' },
        excerpt: { rendered: '<p>Another sample excerpt for development.</p>' },
        content: { rendered: '<p>More sample content here.</p>' },
        featured_media: 0,
        categories: [1],
        tags: [],
        _embedded: {
          author: [{ id: 1, name: 'Admin', slug: 'admin' }],
          'wp:featuredmedia': [],
          'wp:term': [[{ id: 1, name: 'News', slug: 'news' }]]
        }
      }
    ],
    pagination: {
      currentPage: 1,
      perPage: 10,
      totalPages: 1,
      totalItems: 2,
      hasNextPage: false
    }
  },
  'categories': [
    { id: 1, name: 'News', slug: 'news', count: 5 },
    { id: 2, name: 'Sports', slug: 'sports', count: 3 }
  ]
}

const useMockData = process.env.NODE_ENV === 'development' && 
  (!process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 
   process.env.NEXT_PUBLIC_WORDPRESS_API_URL.includes('localhost'))

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const startTime = Date.now()
  
  try {
    // AWAIT the params FIRST
    const { path } = await context.params
    const searchParams = request.nextUrl.searchParams
    
    // Normalize cache key for better hit rates
    const sortedParams = Array.from(searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    
    const cacheKey = `${path.join('/')}:${sortedParams}`
    
    // Check cache with expiry validation
    const cached = cache.get(cacheKey)
    if (cached && Date.now() < cached.expiry) {
      const responseTime = Date.now() - startTime
      
      // Build headers for cached response
      const headers = new Headers()
      headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
      headers.set('X-Cache', 'HIT')
      headers.set('X-Response-Time', `${responseTime}ms`)
      headers.set('X-Proxy', 'NextJS-WordPress-Proxy')
      headers.set('Vary', 'Accept-Encoding')
      
      // Add WordPress headers from cache
      if (cached._headers?.wpTotal) {
        headers.set('X-WP-Total', cached._headers.wpTotal.toString())
      }
      if (cached._headers?.wpTotalPages) {
        headers.set('X-WP-TotalPages', cached._headers.wpTotalPages.toString())
      }
      if (cached._headers?.link) {
        headers.set('Link', cached._headers.link)
      }
      if (cached.etag) {
        headers.set('ETag', cached.etag)
      }
      
      return new NextResponse(JSON.stringify(cached.data), {
        status: 200,
        headers: headers
      })
    }

    // Use mock data in development
    if (useMockData) {
      const pathKey = path.join('/')
      let mockResponse = mockData[pathKey as keyof typeof mockData]
      
      if (pathKey === 'posts' && mockResponse) {
        const page = parseInt(searchParams.get('page') || '1')
        const per_page = parseInt(searchParams.get('per_page') || '10')
        
        mockResponse = {
          ...mockResponse,
          pagination: {
            ...(mockResponse as any).pagination,
            currentPage: page,
            perPage: per_page
          }
        }
      }
      
      if (mockResponse !== undefined) {
        cache.set(cacheKey, {
          data: mockResponse,
          expiry: Date.now() + 60000,
          _headers: {
            wpTotal: (mockResponse as any).pagination?.totalItems || '0',
            wpTotalPages: (mockResponse as any).pagination?.totalPages || '0'
          }
        })
        
        const headers = new Headers()
        headers.set('Cache-Control', 'public, s-maxage=60')
        headers.set('X-Cache', 'MOCK')
        headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
        headers.set('X-WP-Total', (mockResponse as any).pagination?.totalItems || '0')
        headers.set('X-WP-TotalPages', (mockResponse as any).pagination?.totalPages || '0')
        
        return new NextResponse(JSON.stringify(mockResponse), {
          status: 200,
          headers: headers
        })
      }
    }

    // Build WordPress API URL - FIXED: Check if it's the full URL or needs /wp/v2
    let wordpressUrl: string
    if (WORDPRESS_API_URL.includes('/wp/v2')) {
      // Already has /wp/v2 in the URL
      wordpressUrl = `${WORDPRESS_API_URL}/${path.join('/')}${sortedParams ? `?${sortedParams}` : ''}`
    } else {
      // Add /wp/v2 if not present
      wordpressUrl = `${WORDPRESS_API_URL}/wp/v2/${path.join('/')}${sortedParams ? `?${sortedParams}` : ''}`
    }
    
    // Fetch with timeout and optimized headers
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
    
    const response = await fetch(wordpressUrl, {
      headers: {
        'User-Agent': 'Igihe-NextJS-Proxy/2.0',
        'Accept': 'application/json',
      },
      signal: controller.signal,
      // Remove next.revalidate for build compatibility
      cache: 'no-store' // Use this instead for build time
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      // Fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        const pathKey = path.join('/')
        const mockResponse = mockData[pathKey as keyof typeof mockData]
        if (mockResponse !== undefined) {
          const headers = new Headers()
          headers.set('X-Cache', 'MOCK-FALLBACK')
          headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
          
          return new NextResponse(JSON.stringify(mockResponse), {
            status: 200,
            headers: headers
          })
        }
      }
      
      return NextResponse.json(
        { error: 'WordPress API error', status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    const etag = response.headers.get('etag') || undefined
    const wpTotal = response.headers.get('X-WP-Total')
    const wpTotalPages = response.headers.get('X-WP-TotalPages')
    const linkHeader = response.headers.get('Link')
    
    // Determine cache TTL
    const cacheTtl = getCacheTTL(path)
    
    // Store in cache
    cache.set(cacheKey, {
      data,
      expiry: Date.now() + cacheTtl,
      etag, 
      _headers: {
        wpTotal,
        wpTotalPages,
        link: linkHeader
      }
    })

    const responseTime = Date.now() - startTime
    const cacheControlValue = `public, s-maxage=${Math.floor(cacheTtl / 1000)}, stale-while-revalidate=${Math.floor(cacheTtl / 500)}`

    // Build response headers
    const headers = new Headers()
    headers.set('Cache-Control', cacheControlValue)
    headers.set('X-Cache', 'MISS')
    headers.set('X-Response-Time', `${responseTime}ms`)
    headers.set('X-Proxy', 'NextJS-WordPress-Proxy')
    headers.set('Vary', 'Accept-Encoding')
    
    if (wpTotal) headers.set('X-WP-Total', wpTotal)
    if (wpTotalPages) headers.set('X-WP-TotalPages', wpTotalPages)
    if (linkHeader) headers.set('Link', linkHeader)
    if (etag) headers.set('ETag', etag)

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: headers
    })

  } catch (error: any) {
    const isTimeout = error instanceof Error && error.name === 'AbortError'
    
    // Fallback to mock data on error - WITHOUT accessing context.params again
    if (process.env.NODE_ENV === 'development') {
      // Try to get the path from the request URL instead
      const requestPath = request.nextUrl.pathname.replace('/api/proxy/', '')
      const pathKey = requestPath
      const mockResponse = mockData[pathKey as keyof typeof mockData]
      
      if (mockResponse !== undefined) {
        const headers = new Headers()
        headers.set('X-Cache', 'MOCK-ERROR')
        headers.set('X-Error', isTimeout ? 'timeout' : 'unknown')
        
        return new NextResponse(JSON.stringify(mockResponse), {
          status: 200,
          headers: headers
        })
      }
    }
    
    console.error('Proxy error:', error)
    
    return NextResponse.json(
      { 
        error: isTimeout ? 'Request timeout' : 'Internal server error',
        message: error?.message || 'Unknown error'
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}

export const dynamic = 'force-dynamic' // Ensure dynamic rendering