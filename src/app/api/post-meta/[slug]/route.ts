// app/api/post-meta/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> } // params is a Promise
) {
  try {
    // AWAIT the params
    const { slug } = await params
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    // Fetch from WordPress API
    const WORDPRESS_API = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 
                         'https://new.igihe.com/wp-json/wp/v2'
    
    console.log(`[Metadata API] Fetching: ${slug}`)
    
    const response = await fetch(
      `${WORDPRESS_API}/posts?slug=${slug}&_embed=1`,
      {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'IGIHE-Metadata-API/1.0'
        },
        next: { revalidate: 60 } // Cache for 60 seconds
      }
    )
    
    console.log(`[Metadata API] Response status: ${response.status}`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `WordPress API error: ${response.status}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    const post = data[0]
    
    // Extract metadata
    const title = post.yoast_head_json?.title || 
                 post.title?.rendered || 
                 slug.split('-').map(word => 
                   word.charAt(0).toUpperCase() + word.slice(1)
                 ).join(' ')
    
    const rawDescription = post.yoast_head_json?.description || 
                          post.excerpt?.rendered || ''
    
    const description = rawDescription
      .replace(/<[^>]*>/g, '')
      .substring(0, 155)
    
    const image = post.yoast_head_json?.og_image?.[0]?.url || 
                 post._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''
    
    const author = post._embedded?.author?.[0]?.name || 'IGIHE Editorial Team'
    const publishedTime = post.date || new Date().toISOString()
    
    // Extract keywords from tags
    const tags = post.tags || post._embedded?.['wp:term']?.[1] || []
    const keywords = tags
      .map((tag: any) => tag.name)
      .filter(Boolean)
      .join(', ')
    
    const metadata = {
      title,
      description,
      image,
      author,
      publishedTime,
      keywords,
      slug: post.slug,
      url: post.link || `https://stage.igihe.com/news/${slug}`,
      type: 'article',
      siteName: 'IGIHE'
    }
    
    return NextResponse.json(metadata, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'Content-Type': 'application/json'
      }
    })
    
  } catch (error: any) {
    console.error('[Metadata API] Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    )
  }
}