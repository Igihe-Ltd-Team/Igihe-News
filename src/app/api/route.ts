// app/api/wordpress/[...path]/route.ts (Enhanced version)
import { NextRequest, NextResponse } from 'next/server'

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL
const CACHE = new Map()

class ProxyCache {
  static get(key: string) {
    const item = CACHE.get(key)
    if (item && Date.now() < item.expiry) {
      return item.data
    }
    CACHE.delete(key)
    return null
  }

  static set(key: string, data: any, ttl: number = 300000) {
    CACHE.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path } = params
    const searchParams = request.nextUrl.searchParams
    
    // Create cache key
    const cacheKey = `proxy:${path.join('/')}:${searchParams.toString()}`
    
    // Check cache first
    const cached = ProxyCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      })
    }

    const wordpressUrl = `${WORDPRESS_API_URL}/${path.join('/')}?${searchParams.toString()}`
    
    const response = await fetch(wordpressUrl, {
      headers: {
        'User-Agent': 'Igihe-NextJS-Proxy/1.0',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'WordPress API error', status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Cache based on endpoint type
    let cacheTtl = 300000 // 5 minutes default
    if (path.includes('posts')) cacheTtl = 120000 // 2 minutes
    if (path.includes('categories')) cacheTtl = 1800000 // 30 minutes
    
    ProxyCache.set(cacheKey, data, cacheTtl)

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    
    if (error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}