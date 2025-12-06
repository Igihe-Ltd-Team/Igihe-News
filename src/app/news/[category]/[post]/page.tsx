import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SingleNewsContent from '@/components/news/SingleNewsContent'
import { stripHtml } from '@/lib/utils'
import { ApiService } from '@/services/apiService'
import { Tag } from '@/types/fetchData'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // always fresh page

interface PageProps {
  params: Promise<{ post: string }>
}

/* ------------------------ CACHE LOOKUP ------------------------ */
async function getCachedPost(slug: string) {
  try {
    const cacheKey = `post:${slug}`
    const cached = ApiService.getCachedArticle(cacheKey)
    return cached ?? null
  } catch (e) {
    console.error("Cache error:", e)
    return null
  }
}

/* ------------------------ METADATA ------------------------ */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { post } = await params
  
  const title = post.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') + ' | IGIHE'
  
  const description = `Read "${title}" on IGIHE - Latest news and updates from Rwanda`
  
  // Use the OG image generator
  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/og?title=${encodeURIComponent(title)}`
  
  return {
    title,
    description,
    
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/news/news/${post}`,
      siteName: 'IGIHE',
      images: [{
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: title,
      }],
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}


/* ------------------------ PAGE ------------------------ */
export default async function SingleNewsPage({ params }: PageProps) {
  const { post } = await params
  return <SingleNewsContent slug={post} />
}