import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import SingleNewsContent from '@/components/news/SingleNewsContent'
import { stripHtml } from '@/lib/utils'
import { ApiService } from '@/services/apiService'
import { Tag } from '@/types/fetchData'

interface PageProps {
  params: Promise<{ post: string }>
}

// CRITICAL: Use Node.js runtime to work with your proxy architecture
export const runtime = 'adge' // Changed from 'edge'!
export const revalidate = 600 // 10 minutes ISR

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { post } = await params
  
  console.log(`[Metadata Start] ${post}`)
  
  try {
    // Use your existing ApiService which handles proxy routing
    const postData = await ApiService.fetchPostBySlug(post)

    if (!postData) {
      console.error(`[Metadata] Post not found: ${post}`)
      return {
        title: 'Article Not Found | IGIHE',
        description: 'The requested article could not be found.',
        robots: {
          index: false,
          follow: true,
        },
      }
    }

    console.log(`[Metadata Success] ${post} - ID: ${postData.id}`)

    // Extract metadata with fallbacks
    const rawTitle = postData?.yoast_head_json?.title || 
      postData?.title?.rendered || 
      'News Article'

    const cleanTitle = stripHtml(rawTitle)

    const rawDescription = postData?.yoast_head_json?.description || 
      postData?.excerpt?.rendered || 
      ''

    const cleanDescription = stripHtml(rawDescription).substring(0, 160)

    // Get the best available image
    const ogImage = postData?.yoast_head_json?.og_image?.[0]?.url || 
      postData?._embedded?.['wp:featuredmedia']?.[0]?.source_url

    // Extract author information
    const authorName = postData?._embedded?.author?.[0]?.name || 'IGIHE Editorial Team'

    // Extract tags safely
    const tags = postData?.tags || postData?._embedded?.['wp:term']?.[1] || []
    const keywords = tags.length > 0 ? tags.map((tag: Tag) => tag.name).join(', ') : undefined

    // Build full URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
      process.env.NEXT_PUBLIC_APP_URL || 
      'https://stage.igihe.com'
    const fullUrl = postData?.link || `${baseUrl}/news/${post}`

    // Build comprehensive metadata
    return {
      title: cleanTitle,
      description: cleanDescription,
      keywords,

      // Canonical URL
      alternates: {
        canonical: fullUrl,
      },

      // Open Graph metadata
      openGraph: {
        title: postData?.yoast_head_json?.og_title || cleanTitle,
        description: postData?.yoast_head_json?.og_description || cleanDescription,
        url: fullUrl,
        siteName: 'IGIHE',
        locale: postData?.yoast_head_json?.og_locale || 'en_US',
        type: 'article',
        publishedTime: postData?.date,
        modifiedTime: postData?.modified,
        authors: [authorName],
        tags: tags.map((tag: Tag) => tag.name),
        images: ogImage ? [{
          url: ogImage,
          width: 1200,
          height: 630,
          alt: cleanTitle,
        }] : [],
      },

      // Twitter Card metadata
      twitter: {
        card: 'summary_large_image',
        title: postData?.yoast_head_json?.twitter_title || cleanTitle,
        description: postData?.yoast_head_json?.twitter_description || cleanDescription,
        creator: '@igihe',
        site: '@igihe',
        images: ogImage ? [ogImage] : [],
      },

      // SEO metadata
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },

      // Additional metadata
      category: postData?.categories?.[0]?.name || 
        postData?._embedded?.['wp:term']?.[0]?.[0]?.name,
    }
  } catch (error: any) {
    console.error('[Metadata Error]:', {
      slug: post,
      message: error?.message,
      stack: error?.stack
    })
    
    // Return basic metadata instead of failing
    const fallbackTitle = post
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    return {
      title: `${fallbackTitle} | IGIHE`,
      description: 'Read the latest news and updates from IGIHE.',
      robots: {
        index: false,
        follow: true,
      },
    }
  }
}

export default async function SingleNewsPage({ params }: PageProps) {
  const { post } = await params
  
  console.log(`[Page Start] ${post}`)
  
  try {
    // Check cache first
    const cacheKey = `post:${post}`
    let postData = ApiService.getCachedArticle(cacheKey)
    
    if (postData) {
      console.log(`[Page Cache HIT] ${post}`)
    } else {
      console.log(`[Page Cache MISS] ${post} - Fetching...`)
      // Use your existing ApiService
      postData = await ApiService.fetchPostBySlug(post)
      
      if (postData) {
        // Cache it for client-side use
        ApiService.cacheArticles(postData)
        console.log(`[Page Fetched & Cached] ${post}`)
      }
    }
    
    if (!postData) {
      console.error(`[Page] Post not found: ${post}`)
      notFound()
    }

    console.log(`[Page Success] ${post} - Rendering...`)

    // Pass the fetched data to avoid re-fetching
    return <SingleNewsContent slug={post} initialArticle={postData} />
  } catch (error: any) {
    console.error('[Page Error]:', {
      slug: post,
      message: error?.message,
      name: error?.name
    })
    notFound()
  }
}