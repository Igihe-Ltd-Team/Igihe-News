// import { notFound } from 'next/navigation'
// import { Metadata } from 'next'
// import SingleNewsContent from '@/components/news/SingleNewsContent'
// import { stripHtml } from '@/lib/utils'
// import { ApiService } from '@/services/apiService'
// import { Tag } from '@/types/fetchData'

// interface PageProps {
//   params: Promise<{ post: string }>
// }

// export const runtime = 'edge'
// export const dynamic = 'force-dynamic'

// async function getCachedPost(slug: string): Promise<any | null> {
//   try {
//     // Try to get from cache first
//     const cacheKey = `post:${slug}`
//     const cached = ApiService.getCachedArticle(cacheKey)
    
//     if (cached) {
//       return cached
//     }
    
//     return null
//   } catch (error) {
//     console.error('Cache retrieval error:', error)
//     return null
//   }
// }



// export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
//   const { post } = await params
  
//   // Add timeout and better error handling
//   try {

//     let postData = await getCachedPost(post)
//     let fromCache = !!postData

//     if (!postData) {
//       const controller = new AbortController()
//       const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 seconds for metadata
      
//       postData = await ApiService.fetchPostBySlug(post)
//       clearTimeout(timeoutId)
//     }


//     if (!postData) {
//       console.error(`Post not found: ${post}`)
//       return {
//         title: 'Article Not Found',
//         description: 'The requested article could not be found.',
//       }
//     }

//     // Safely extract metadata with fallbacks
//     const title = postData?.yoast_head_json?.title || 
//       postData?.title?.rendered || 
//       'News Article'

//     const cleanTitle = stripHtml(title)

//     const description = postData?.yoast_head_json?.description || 
//       postData?.excerpt?.rendered || 
//       ''

//     const cleanDescription = stripHtml(description).substring(0, 160)

//     // Get the best available image
//     const ogImage = postData?.yoast_head_json?.og_image?.[0]?.url || 
//       postData?._embedded?.['wp:featuredmedia']?.[0]?.source_url

//     // Extract author information
//     const authorName = postData?._embedded?.author?.[0]?.name || 
//       postData?.author

//     // Build comprehensive metadata
//     return {
//       title: cleanTitle,
//       description: cleanDescription,
      
//       // Add keywords if available
//       ...(postData?.tags && postData.tags.length > 0 && {
//         keywords: postData.tags.map((tag:Tag) => tag.name).join(', ')
//       }),

//       // Add canonical URL
//       alternates: {
//         canonical: postData?.link || `https://stage.igihe.com/news/news/${post}`
//       },

//       // Open Graph metadata
//       openGraph: {
//         title: postData?.yoast_head_json?.og_title || cleanTitle,
//         description: postData?.yoast_head_json?.og_description || cleanDescription,
//         url: postData?.link,
//         siteName: 'IGIHE',
//         locale: postData?.yoast_head_json?.og_locale || 'en_US',
//         type: 'article',
//         ...(postData?.date && { publishedTime: postData.date }),
//         ...(postData?.modified && { modifiedTime: postData.modified }),
//         ...(ogImage && { images: [{ url: ogImage, alt: cleanTitle }] }),
//         ...(authorName && { 
//           article: { 
//             authors: [authorName],
//             ...(postData?.tags && { tags: postData.tags.map((tag:Tag) => tag.name) })
//           }
//         })
//       },

//       // Twitter Card metadata
//       twitter: {
//         card: 'summary_large_image',
//         title: postData?.yoast_head_json?.twitter_title || cleanTitle,
//         description: postData?.yoast_head_json?.twitter_description || cleanDescription,
//         ...(ogImage && { images: [ogImage] }),
//         ...(authorName && { creator: `@${authorName}` })
//       },

//       // Additional SEO improvements
//       robots: {
//         index: true,
//         follow: true,
//         googleBot: {
//           index: true,
//           follow: true,
//           'max-video-preview': -1,
//           'max-image-preview': 'large',
//           'max-snippet': -1,
//         },
//       },
//     }
//   } catch (error) {
//     console.error('Error generating metadata:', error)
    
//     // Return basic metadata instead of failing
//     return {
//       title: `${post.replace(/-/g, ' ')} | igihe.com`,
//       description: 'Read the latest news and updates.',
//       robots: {
//         index: false, // Don't index error pages
//         follow: true,
//       },
//     }
//   }
// }

// export default async function SingleNewsPage({ params }: PageProps) {
//   const { post } = await params
//   const postData = await getCachedPost(post)
//   return <SingleNewsContent slug={post} initialArticle={postData}/>
// }



import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import SingleNewsContent from '@/components/news/SingleNewsContent'
import { stripHtml } from '@/lib/utils'
import { ApiService } from '@/services/apiService'
import { Tag } from '@/types/fetchData'

interface PageProps {
  params: Promise<{ post: string }>
}

// Keep edge runtime if you need it, but with optimizations
export const runtime = 'edge'
// Use ISR instead of force-dynamic for better performance
export const revalidate = 600 // 10 minutes

// Shared fetch function to avoid code duplication
async function fetchPostData(slug: string, timeout = 5000): Promise<any | null> {
  try {
    // Check cache first
    const cacheKey = `post:${slug}`
    const cached = ApiService.getCachedArticle(cacheKey)
    
    if (cached) {
      console.log(`[Cache HIT] ${slug}`)
      return cached
    }

    console.log(`[Cache MISS] Fetching ${slug}`)

    // Fetch with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const postData = await ApiService.fetchPostBySlug(slug)
      clearTimeout(timeoutId)

      
      return postData
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error(`[Timeout] ${slug} after ${timeout}ms`)
      } else {
        console.error(`[Fetch Error] ${slug}:`, fetchError.message)
      }
      
      return null
    }
  } catch (error) {
    console.error(`[Error] fetchPostData for ${slug}:`, error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { post } = await params
  
  try {
    // Shorter timeout for metadata (edge runtime has time limits)
    const postData = await fetchPostData(post, 3000)

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

    // Safely extract metadata with fallbacks
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
      postData?._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
      postData?.featured_media_url

    // Extract author information
    const authorName = postData?._embedded?.author?.[0]?.name || 
      postData?.author_name ||
      postData?.author ||
      'IGIHE Editorial Team'

    // Extract tags safely
    const tags = postData?.tags || postData?._embedded?.['wp:term']?.[1] || []
    const keywords = tags.length > 0 ? tags.map((tag: Tag) => tag.name).join(', ') : undefined

    // Build full URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stage.igihe.com'
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
  } catch (error) {
    console.error('[Metadata Error]:', error)
    
    // Return basic metadata instead of failing
    const fallbackTitle = post
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    return {
      title: `${fallbackTitle} | IGIHE`,
      description: 'Read the latest news and updates from IGIHE.',
      robots: {
        index: false, // Don't index error pages
        follow: true,
      },
    }
  }
}

export default async function SingleNewsPage({ params }: PageProps) {
  const { post } = await params
  const postData = await fetchPostData(post, 8000)
  return <SingleNewsContent slug={post} initialArticle={postData} />
  
}