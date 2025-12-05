// app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://new.igihe.com/wp-json/wp/v2'

// Simple cache implementation for Edge
class EdgeCache {
  private cache = new Map<string, { data: any; expiry: number }>()
  private maxSize: number

  constructor(maxSize = 100) {
    this.maxSize = maxSize
  }

  get(key: string) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    // Check if expired
    if (Date.now() > cached.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }

  set(key: string, data: any, ttl: number) {
    // Remove if exists
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    
    this.cache.set(key, { data, expiry: Date.now() + ttl })
  }

  clear() {
    this.cache.clear()
  }
}

const cache = new EdgeCache(100)

// Cache TTL configuration
const CACHE_TTL = {
  posts: 60000,     // 1 minute
  default: 30000    // 30 seconds
}

// Get cache TTL based on path
function getCacheTTL(pathname: string): number {
  if (pathname.includes('posts')) return CACHE_TTL.posts
  return CACHE_TTL.default
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const startTime = Date.now()
  
  try {
    // Extract path from params
    const pathSegments = params.path || []
    const searchParams = request.nextUrl.searchParams
    
    console.log(`[Proxy] Request for: ${pathSegments.join('/')}`)
    
    // Build cache key
    const sortedParams = Array.from(searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')
    
    const cacheKey = `${pathSegments.join('/')}:${sortedParams}`
    
    // Check cache
    const cached = cache.get(cacheKey)
    if (cached) {
      const responseTime = Date.now() - startTime
      console.log(`[Proxy] Cache hit for: ${cacheKey}`)
      
      return NextResponse.json(cached, {
        headers: {
          'X-Cache': 'HIT',
          'X-Response-Time': `${responseTime}ms`,
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      })
    }
    
    // Build WordPress API URL
    const wordpressPath = pathSegments.join('/')
    const wordpressUrl = `${WORDPRESS_API_URL}/${wordpressPath}${sortedParams ? `?${sortedParams}` : ''}`
    
    console.log(`[Proxy] Fetching from: ${wordpressUrl}`)
    
    // Fetch with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(wordpressUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'IGIHE-Proxy/1.0'
      },
      signal: controller.signal,
      cache: 'no-store' // Don't cache in fetch
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      console.error(`[Proxy] WordPress API error: ${response.status}`)
      return NextResponse.json(
        { error: 'WordPress API error', status: response.status },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    const responseTime = Date.now() - startTime
    
    // Cache the response
    const ttl = getCacheTTL(wordpressPath)
    cache.set(cacheKey, data, ttl)
    
    console.log(`[Proxy] Success for: ${wordpressPath} (${responseTime}ms)`)
    
    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'X-Response-Time': `${responseTime}ms`,
        'Cache-Control': `public, s-maxage=${Math.floor(ttl/1000)}, stale-while-revalidate=${Math.floor(ttl/500)}`
      }
    })
    
  } catch (error: any) {
    console.error('[Proxy] Error:', error)
    
    const isTimeout = error.name === 'AbortError'
    
    return NextResponse.json(
      {
        error: isTimeout ? 'Request timeout' : 'Internal server error',
        message: error.message
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}

// Handle POST requests if needed
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const pathSegments = params.path || []
    const wordpressPath = pathSegments.join('/')
    const wordpressUrl = `${WORDPRESS_API_URL}/${wordpressPath}`
    
    const body = await request.json()
    
    const response = await fetch(wordpressUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Proxy error', message: error.message },
      { status: 500 }
    )
  }
}