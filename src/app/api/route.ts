// app/api/wordpress/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'https://new.igihe.com/wp-json'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await the params in Next.js 14+
    const { path } = await context.params
    const searchParams = request.nextUrl.searchParams
    
    const wordpressUrl = `${WORDPRESS_API_URL}/${path.join('/')}?${searchParams.toString()}`
    
    console.log('Proxying to:', wordpressUrl)
    
    const response = await fetch(wordpressUrl, {
      headers: {
        'User-Agent': 'Igihe-NextJS-Proxy/1.0',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'WordPress API error', status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Proxy': 'NextJS-WordPress-Proxy',
      },
    })
  } catch (error) {
    console.error('Proxy error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}