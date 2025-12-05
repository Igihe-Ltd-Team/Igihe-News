// app/api/post-meta/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    
    // Fetch from WordPress API
    const WORDPRESS_API = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 
                         'https://new.igihe.com/wp-json/wp/v2'
    
    const response = await fetch(
      `${WORDPRESS_API}/posts?slug=${slug}&_embed=1`,
      {
        headers: { 'Accept': 'application/json' }
      }
    )
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    const data = await response.json()
    const post = data[0]
    
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }
    
    // Extract metadata
    const title = post.yoast_head_json?.title || post.title?.rendered || ''
    const description = post.yoast_head_json?.description || 
                       post.excerpt?.rendered?.replace(/<[^>]*>/g, '').substring(0, 155) || ''
    
    const image = post.yoast_head_json?.og_image?.[0]?.url || 
                 post._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''
    
    const author = post._embedded?.author?.[0]?.name || ''
    const publishedTime = post.date || ''
    
    // Extract keywords from tags
    const tags = post.tags || post._embedded?.['wp:term']?.[1] || []
    const keywords = tags.map((tag: any) => tag.name).join(', ')
    
    return NextResponse.json({
      title,
      description,
      image,
      author,
      publishedTime,
      keywords,
      slug: post.slug
    })
    
  } catch (error) {
    console.error('Metadata API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}