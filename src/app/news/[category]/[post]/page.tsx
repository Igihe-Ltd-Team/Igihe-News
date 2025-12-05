import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { ApiService } from '@/services/apiService'
import SingleNewsContent from '@/components/news/SingleNewsContent'
import { stripHtml } from '@/lib/utils'

interface PageProps {
  params: Promise<{ post: string }>
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { post } = await params
  
  // Add timeout and better error handling
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const postData = await ApiService.fetchPostBySlug(post)
    clearTimeout(timeoutId)

    if (!postData) {
      console.error(`Post not found: ${post}`)
      return {
        title: 'Article Not Found',
        description: 'The requested article could not be found.',
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
    const ogImage = postData?.yoast_head_json?.og_image?.[0]?.url || 
      postData?._embedded?.['wp:featuredmedia']?.[0]?.source_url

    // Extract author information
    const authorName = postData?._embedded?.author?.[0]?.name || 
      postData?.author

    // Build comprehensive metadata
    return {
      title: cleanTitle,
      description: cleanDescription,
      
      // Add keywords if available
      ...(postData?.tags && postData.tags.length > 0 && {
        keywords: postData.tags.map(tag => tag.name).join(', ')
      }),

      // Add canonical URL
      alternates: {
        canonical: postData?.link || `https://stage.igihe.com/news/news/${post}`
      },

      // Open Graph metadata
      openGraph: {
        title: postData?.yoast_head_json?.og_title || cleanTitle,
        description: postData?.yoast_head_json?.og_description || cleanDescription,
        url: postData?.link,
        siteName: 'IGIHE',
        locale: postData?.yoast_head_json?.og_locale || 'en_US',
        type: 'article',
        ...(postData?.date && { publishedTime: postData.date }),
        ...(postData?.modified && { modifiedTime: postData.modified }),
        ...(ogImage && { images: [{ url: ogImage, alt: cleanTitle }] }),
        ...(authorName && { 
          article: { 
            authors: [authorName],
            ...(postData?.tags && { tags: postData.tags.map(tag => tag.name) })
          }
        })
      },

      // Twitter Card metadata
      twitter: {
        card: 'summary_large_image',
        title: postData?.yoast_head_json?.twitter_title || cleanTitle,
        description: postData?.yoast_head_json?.twitter_description || cleanDescription,
        ...(ogImage && { images: [ogImage] }),
        ...(authorName && { creator: `@${authorName}` })
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
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    
    // Return basic metadata instead of failing
    return {
      title: `${post.replace(/-/g, ' ')} | Your Site`,
      description: 'Read the latest news and updates.',
      robots: {
        index: false, // Don't index error pages
        follow: true,
      },
    }
  }
}

export default async function SingleNewsPage({ params }: PageProps) {
  const { post } = await params
  
  try {
    // Verify the post exists before rendering
    const postData = await ApiService.fetchPostBySlug(post)
    
    if (!postData) {
      notFound()
    }

    return <SingleNewsContent slug={post} />
  } catch (error) {
    console.error('Error loading post:', error)
    notFound()
  }
}