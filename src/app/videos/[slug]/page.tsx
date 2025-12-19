import { stripHtml } from "@/lib/utils";
import { Metadata } from "next";
import VideoContents from "@/components/videos/VideoContents";


interface PageProps {
  params: Promise<{ slug: string }>
}


async function getPostData(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/igh-yt-videos?slug=${slug}&_embed`,
      { 
        next: { revalidate: 60 },
        // cache: 'no-store' // Force fresh data
      }
    )
    
    if (!response.ok) return null
    
    const posts = await response.json()
    return posts && posts.length > 0 ? posts[0] : null
    
  } catch (error) {
    console.error('❌ Fetch error:', error)
    return null
  }
}

/* ------------------------ METADATA ------------------------ */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  
  // Capitalize slug for fallback title
  const fallbackTitle = slug
    .split('-')
    .map((word:string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  
  try {
    const postData = await getPostData(slug)
    
    // If no post data, return simple metadata
    if (!postData) {
      return {
        title: `${fallbackTitle} | IGIHE`,
        description: 'Latest news from IGIHE Rwanda'
      }
    }
    
    // Extract title safely
    const title = stripHtml(
      postData.yoast_head_json?.title || 
      postData.title?.rendered || 
      fallbackTitle
    )
    
    // Extract description safely
    const description = stripHtml(
      postData.yoast_head_json?.description || 
      postData.excerpt?.rendered || 
      'Latest news from IGIHE Rwanda'
    ).substring(0, 160)
    
    // Extract image safely
    const ogImage = 
      postData.yoast_head_json?.og_image?.[0]?.url ||
      postData._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''
    
    // Extract author safely
    const author = postData._embedded?.author?.[0]?.name
    
    // Build clean metadata
    return {
      title: `${title} | IGIHE`,
      description,
      
      ...(postData.tags && postData.tags.length > 0 && {
        keywords: postData.tags.map((t: any) => t.name || '').join(', ')
      }),
      
      alternates: {
        canonical: postData.link
      },
      
      openGraph: {
        type: 'article',
        title,
        description,
        url: postData.link,
        siteName: 'IGIHE',
        locale: 'en_US',
        images: [{
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title
        }],
        ...(postData.date && { publishedTime: postData.date }),
        ...(postData.modified && { modifiedTime: postData.modified }),
        ...(author && {
          article: {
            authors: [author],
            ...(postData.tags && postData.tags.length > 0 && {
              tags: postData.tags.map((t: any) => t.name || '')
            })
          }
        })
      },
      
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage]
      },
      
      robots: {
        index: true,
        follow: true
      }
    }
    
  } catch (error) {
    console.error('❌ Metadata error:', error)
    // Return basic metadata on error (NOT "Article Not Found")
    return {
      title: `${fallbackTitle} | IGIHE`,
      description: 'Latest news from IGIHE Rwanda'
    }
  }
}


export  default async function Page({ params }: PageProps) {
  const { slug } = await params
  return <VideoContents slug={slug}/>
}