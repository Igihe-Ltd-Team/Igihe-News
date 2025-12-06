// app/news/news/[post]/page.tsx
import SingleNewsContent from '@/components/news/SingleNewsContent'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ post: string }>
}

/* ------------------------ SAFE DATA FETCHER ------------------------ */
async function getPostData(slug: string) {
  try {
    // Try to get from API
    const response = await fetch(
      `https://new.igihe.com/v_elementor/wp-json/wp/v2/posts?slug=${slug}&_embed`,
      { 
        next: { revalidate: 60 },
      }
    )
    
    if (!response.ok) {
      console.error('API response not OK:', response.status)
      return null
    }
    
    const posts = await response.json()
    return posts[0] || null
    
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

/* ------------------------ SAFE METADATA GENERATOR ------------------------ */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { post: slug } = await params
  
  try {
    // 1. Try to fetch post data
    const postData = await getPostData(slug)
    
    // 2. If no data, return basic metadata (NOT error message)
    if (!postData) {
      const titleFromSlug = slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      return {
        title: `${titleFromSlug} | IGIHE`,
        description: `Read "${titleFromSlug}" on IGIHE - Latest news from Rwanda`,
        openGraph: {
          type: 'article',
          title: `${titleFromSlug} | IGIHE`,
          description: `Read "${titleFromSlug}" on IGIHE`,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/news/news/${slug}`,
          siteName: 'IGIHE',
          images: [{
            url: `${process.env.NEXT_PUBLIC_APP_URL}/og?title=` + encodeURIComponent(titleFromSlug),
            width: 1200,
            height: 630,
            alt: titleFromSlug,
          }],
        },
        twitter: {
          card: 'summary_large_image',
          title: `${titleFromSlug} | IGIHE`,
          description: `Read "${titleFromSlug}" on IGIHE`,
          images: [`${process.env.NEXT_PUBLIC_APP_URL}/og?title=` + encodeURIComponent(titleFromSlug)],
        },
      }
    }
    
    // 3. Extract data SAFELY
    const title = extractTitle(postData)
    const description = extractDescription(postData)
    const ogImage = extractOgImage(postData)
    const author = extractAuthor(postData)
    const date = postData.date || new Date().toISOString()
    
    // 4. Build metadata
    const metadata: Metadata = {
      title: `${title} | IGIHE`,
      description,
      keywords: extractKeywords(postData),
      
      alternates: {
        canonical: postData.link || `${process.env.NEXT_PUBLIC_APP_URL}/news/news/${slug}`
      },
      
      openGraph: {
        type: 'article',
        title: `${title} | IGIHE`,
        description,
        url: postData.link || `${process.env.NEXT_PUBLIC_APP_URL}/news/news/${slug}`,
        siteName: 'IGIHE',
        locale: 'en_US',
        publishedTime: date,
        modifiedTime: postData.modified || date,
        authors: author ? [author] : undefined,
        tags: extractTags(postData),
        
        // CRITICAL FOR WHATSAPP: Use dynamic OG image with fallback
        images: [{
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        }],
      },
      
      twitter: {
        card: 'summary_large_image',
        title: `${title} | IGIHE`,
        description,
        images: [ogImage],
        creator: '@igihe',
      },
      
      robots: {
        index: true,
        follow: true,
      },
      
      // Additional for WhatsApp
      other: {
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:image:type': 'image/jpeg',
        'article:published_time': date,
        'article:modified_time': postData.modified || date,
        'article:section': extractCategory(postData) || 'News',
      }
    }
    
    return metadata
    
  } catch (error) {
    // CRITICAL: Don't return error metadata
    console.error('Metadata generation error:', error)
    
    // Return basic but proper metadata
    const titleFromSlug = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    return {
      title: `${titleFromSlug} | IGIHE`,
      description: `Read "${titleFromSlug}" on IGIHE - Latest news from Rwanda`,
      openGraph: {
        type: 'article',
        title: `${titleFromSlug} | IGIHE`,
        description: `Read "${titleFromSlug}" on IGIHE`,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/news/news/${slug}`,
        siteName: 'IGIHE',
        images: [{
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=` + encodeURIComponent(titleFromSlug),
          width: 1200,
          height: 630,
          alt: titleFromSlug,
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${titleFromSlug} | IGIHE`,
        description: `Read "${titleFromSlug}" on IGIHE`,
        images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=` + encodeURIComponent(titleFromSlug)],
      },
    }
  }
}

/* ------------------------ HELPER FUNCTIONS ------------------------ */
function extractTitle(postData: any): string {
  try {
    // Try yoast first
    if (postData.yoast_head_json?.title) {
      return stripHtml(postData.yoast_head_json.title)
    }
    // Then WP title
    if (postData.title?.rendered) {
      return stripHtml(postData.title.rendered)
    }
    if (postData.title) {
      return String(postData.title)
    }
  } catch {}
  
  // Fallback to slug
  return postData.slug
    .split('-')
    .map((word:string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function extractDescription(postData: any): string {
  try {
    // Try yoast first
    if (postData.yoast_head_json?.description) {
      const desc = stripHtml(postData.yoast_head_json.description)
      return desc.substring(0, 160)
    }
    // Try excerpt
    if (postData.excerpt?.rendered) {
      const desc = stripHtml(postData.excerpt.rendered)
      return desc.substring(0, 160)
    }
  } catch {}
  
  // Fallback description
  const title = extractTitle(postData)
  return `Read "${title}" on IGIHE - Latest news, breaking stories, and in-depth coverage from Rwanda. Stay informed with IGIHE.`
}

function extractOgImage(postData: any): string {
  try {
    // Try multiple sources
    const imageSources = [
      postData.yoast_head_json?.og_image?.[0]?.url,
      postData._embedded?.['wp:featuredmedia']?.[0]?.source_url,
      postData.featured_image,
      postData.jetpack_featured_media_url,
    ]
    
    for (const img of imageSources) {
      if (img && isValidUrl(img)) {
        return img
      }
    }
  } catch {}
  
  // Fallback to dynamic OG image
  const title = extractTitle(postData)
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(title)}`
}

function extractAuthor(postData: any): string | undefined {
  try {
    return postData._embedded?.author?.[0]?.name || 
           postData.author_data?.display_name ||
           undefined
  } catch {
    return undefined
  }
}

function extractKeywords(postData: any): string | undefined {
  try {
    if (postData.tags?.length) {
      return postData.tags.map((tag: any) => tag.name).join(', ')
    }
  } catch {}
  return undefined
}

function extractTags(postData: any): string[] {
  try {
    return postData.tags?.map((tag: any) => tag.name) || []
  } catch {
    return []
  }
}

function extractCategory(postData: any): string | undefined {
  try {
    return postData.categories?.[0]?.name || 
           postData._embedded?.['wp:term']?.[0]?.[0]?.name ||
           undefined
  } catch {
    return undefined
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/g, '')
    .trim()
}

/* ------------------------ PAGE COMPONENT ------------------------ */
export default async function SingleNewsPage({ params }: PageProps) {
  const { post: slug } = await params
  
  try {
    const postData = await getPostData(slug)
    
    if (!postData) {
      notFound()
    }
    
  return <SingleNewsContent slug={slug} />
    
  } catch (error) {
    console.error('Page error:', error)
    notFound()
  }
}