// app/news/[post]/page.tsx
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import SingleNewsContent from '@/components/news/SingleNewsContent'
import ClientMetadataProvider from '@/components/ClientMetadataProvider'

interface PageProps {
  params: Promise<{ post: string }>
}

export const revalidate = 300

// Server-side metadata (for initial SEO)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { post } = await params
  
  try {
    const WORDPRESS_API = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 
                         'https://new.igihe.com/wp-json/wp/v2'
    
    const response = await fetch(
      `${WORDPRESS_API}/posts?slug=${post}&_embed=1`,
      { next: { revalidate: 60 } }
    )
    
    if (!response.ok) return getFallbackMetadata(post)
    
    const data = await response.json()
    const postData = data[0]
    
    if (!postData) return getFallbackMetadata(post)
    
    const title = postData.title?.rendered || post.replace(/-/g, ' ')
    const description = postData.excerpt?.rendered?.replace(/<[^>]*>/g, '').substring(0, 155) || ''
    const image = postData._embedded?.['wp:featuredmedia']?.[0]?.source_url
    
    return {
      title: `${title} | IGIHE`,
      description,
      openGraph: {
        title,
        description,
        images: image ? [{ url: image }] : [],
        type: 'article',
        publishedTime: postData.date
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : []
      }
    }
    
  } catch (error) {
    return getFallbackMetadata(post)
  }
}

function getFallbackMetadata(slug: string): Metadata {
  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return {
    title: `${title} | IGIHE`,
    description: 'Latest news from IGIHE'
  }
}

export default async function SingleNewsPage({ params }: PageProps) {
  const { post } = await params
  
  try {
    const WORDPRESS_API = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 
                         'https://new.igihe.com/wp-json/wp/v2'
    
    const response = await fetch(
      `${WORDPRESS_API}/posts?slug=${post}&_embed=1`,
      { next: { revalidate: 60 } }
    )
    
    if (!response.ok) notFound()
    
    const data = await response.json()
    const postData = data[0]
    
    if (!postData) notFound()
    
    // Extract metadata for client-side updates
    const metadata = {
      title: postData.title?.rendered,
      description: postData.excerpt?.rendered?.replace(/<[^>]*>/g, '').substring(0, 155),
      image: postData._embedded?.['wp:featuredmedia']?.[0]?.source_url,
      author: postData._embedded?.author?.[0]?.name,
      publishedTime: postData.date,
      keywords: postData.tags?.map((tag: any) => tag.name) || [],
      canonicalUrl: postData.link || `https://stage.igihe.com/news/${post}`
    }
    
    return (
      <ClientMetadataProvider metadata={metadata}>
        <SingleNewsContent slug={post} initialArticle={postData} />
      </ClientMetadataProvider>
    )
    
  } catch (error) {
    notFound()
  }
}