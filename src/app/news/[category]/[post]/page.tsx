import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { ApiService } from '@/services/apiService'
import SingleNewsContent from '@/components/news/SingleNewsContent'
import { stripHtml } from '@/lib/utils'
import { useNewsData } from '@/hooks/useNewsData'

interface PageProps {
  params: Promise<{ post: string }>
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Cache metadata for better performance (Edge Runtime compatible)
const CACHE_DURATION = 60 * 1000 // 1 minute
let metadataCache = new Map<string, { metadata: Metadata; timestamp: number }>()

// Helper function to clean cache
function cleanCache() {
  const now = Date.now()
  for (const [key, value] of metadataCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      metadataCache.delete(key)
    }
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { post } = await params
  
  // Check cache first
  cleanCache()
  const cacheKey = `metadata:${post}`
  const cached = metadataCache.get(cacheKey)
  if (cached) return cached.metadata

  try {
    // Fetch data directly without hooks
    const postData = await fetchPostData(post)

    if (!postData || !postData.id) {
      console.error(`Post not found: ${post}`)
      return {
        title: 'Article Not Found - IGIHE',
        description: 'The requested article could not be found.',
        robots: 'noindex, nofollow'
      }
    }

    // Safely extract metadata with fallbacks
    const title = postData?.yoast_head_json?.title || 
      postData?.title?.rendered || 
      'News Article'

    const cleanTitle = stripHtml(title)

    const description = postData?.yoast_head_json?.description || 
      postData?.excerpt?.rendered || 
      ''

    const cleanDescription = stripHtml(description).substring(0, 160)

    // Get the best available image
    let ogImage = postData?.yoast_head_json?.og_image?.[0]?.url || 
      postData?._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''

    // Ensure absolute URL for images
    // if (ogImage && !ogImage.startsWith('http')) {
    //   ogImage = `https://stage.igihe.com${ogImage.startsWith('/') ? '' : '/'}${ogImage}`
    // }

    // Extract author information
    const authorName = postData?._embedded?.author?.[0]?.name || ''

    // Extract category
    const category = postData?.categories?.[0]?.name || 
      postData?._embedded?.['wp:term']?.[0]?.[0]?.name ||
      ''

    // Build comprehensive metadata
    const metadata: Metadata = {
      title: cleanTitle,
      description: cleanDescription,
      
      // Add keywords if available
      ...(postData?.tags && postData.tags.length > 0 && {
        keywords: postData.tags.map((tag: any) => tag.name).join(', ')
      }),

      // Add canonical URL
      alternates: {
        canonical: postData?.link || `https://stage.igihe.com/news/${post}`
      },

      // Open Graph metadata
      openGraph: {
        title: postData?.yoast_head_json?.og_title || cleanTitle,
        description: postData?.yoast_head_json?.og_description || cleanDescription,
        url: postData?.link || `https://stage.igihe.com/news/${post}`,
        siteName: 'IGIHE',
        locale: postData?.yoast_head_json?.og_locale || 'en_US',
        type: 'article',
        publishedTime: postData?.date || '',
        modifiedTime: postData?.modified || '',
        ...(ogImage && { 
          images: [{ 
            url: ogImage, 
            width: 1200,
            height: 630,
            alt: cleanTitle 
          }] 
        }),
        ...(authorName && { 
          authors: [authorName]
        }),
        ...(category && {
          section: category
        })
      },

      // Twitter Card metadata
      twitter: {
        card: 'summary_large_image',
        title: postData?.yoast_head_json?.twitter_title || cleanTitle,
        description: postData?.yoast_head_json?.twitter_description || cleanDescription,
        creator: authorName ? `@${authorName.replace(/\s+/g, '')}` : undefined,
        site: '@igihe', // Add your actual Twitter handle
        ...(ogImage && { images: [ogImage] }),
      },

      // Additional SEO improvements
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

      // Other metadata
      authors: authorName ? [{ name: authorName }] : undefined,
      category: category || undefined,
      
      // Article specific metadata
      ...(postData?.date && { 
        other: {
          'article:published_time': postData.date,
          ...(postData?.modified && { 'article:modified_time': postData.modified }),
          ...(category && { 'article:section': category }),
          ...(postData?.tags && { 
            'article:tag': postData.tags.map((tag: any) => tag.name).join(', ')
          })
        }
      })
    }

    // Cache the result
    metadataCache.set(cacheKey, {
      metadata,
      timestamp: Date.now()
    })

    return metadata

  } catch (error) {
    console.error('Error generating metadata for post:', post, error)
    
    // Return basic metadata instead of failing
    return {
      title: `${post.replace(/-/g, ' ').toUpperCase()} - IGIHE`,
      description: 'Read the latest news and updates on IGIHE.',
      alternates: {
        canonical: `https://stage.igihe.com/news/${post}`
      },
      robots: {
        index: false,
        follow: true,
      },
    }
  }
}

// Helper function to fetch post data
async function fetchPostData(slug: string) {
const { useArticleDetails } = useNewsData()
  const {
          article,
          relatedPosts,
          articleLoading,
          refetchArticle,
          relatedPostsLoading
      } = useArticleDetails(slug)
      return article
  // try {
  //   const controller = new AbortController()
  //   const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

  //   const response = await fetch(
  //     `https://stage.igihe.com/wp-json/wp/v2/posts?slug=${slug}&_embed`,
  //     {
  //       signal: controller.signal,
  //       headers: {
  //         'User-Agent': 'IGIHE-SEO-Bot/1.0',
  //         'Accept': 'application/json',
  //       },
  //       next: {
  //         revalidate: 60 // Cache for 60 seconds
  //       }
  //     }
  //   )

  //   clearTimeout(timeoutId)

  //   if (!response.ok) {
  //     throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  //   }

  //   const data = await response.json()
    
  //   if (!data || data.length === 0) {
  //     return null
  //   }

  //   return data[0]

  // } catch (error) {
  //   console.error(`Failed to fetch post ${slug}:`, error)
  //   return null
  // }
}

export default async function SingleNewsPage({ params }: PageProps) {
  const { post } = await params
  
  return <SingleNewsContent slug={post} />
}