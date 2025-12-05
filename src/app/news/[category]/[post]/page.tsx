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
export const revalidate = 300 // Optional: ISR fallback if API fails

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL 

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { post } = await params

  let postData: any = null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 7000) // 7s is safer on Edge

    postData = await ApiService.fetchPostBySlug(post)
    clearTimeout(timeoutId)

    if (!postData || !postData.slug) {
      notFound() // This is better than returning fallback metadata
    }
  } catch (error) {
    console.error('Metadata fetch failed for slug:', post, error)
    notFound() // Let Next.js return 404 with clean headers
  }


  const rawTitle = postData.yoast_head_json?.title || postData.title?.rendered || post
  const title = stripHtml(rawTitle)

  const rawDesc = postData.yoast_head_json?.description || postData.excerpt?.rendered || ''
  const description = stripHtml(rawDesc).substring(0, 160)

  const canonicalUrl = postData.link || `${SITE_URL}/news/news/${post}`

  const ogImage = postData.yoast_head_json?.og_image?.[0]?.url ||
                  postData._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
                  `${SITE_URL}/default-og-image.jpg` // ← ADD A FALLBACK IMAGE!

  const authorName = postData._embedded?.author?.[0]?.name || 'IGIHE'

  return {
    title,
    description,

    alternates: {
      canonical: canonicalUrl,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },

    openGraph: {
      title: postData.yoast_head_json?.og_title || title,
      description: postData.yoast_head_json?.og_description || description,
      url: canonicalUrl,
      siteName: 'IGIHE',
      type: 'article',
      locale: 'en_US', // or 'rw_RW' if Kinyarwanda
      publishedTime: postData.date,
      modifiedTime: postData.modified,
      authors: [authorName],
      tags: postData.tags?.map((t: any) => t.name) || [],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: postData.yoast_head_json?.twitter_title || title,
      description: postData.yoast_head_json?.twitter_description || description,
      images: [ogImage],
      creator: '@igihe', // ← Change to your real handle
      site: '@igihe',
    },

    // Optional: Better WhatsApp & Telegram previews
    other: {
      'article:published_time': postData.date,
      'article:modified_time': postData.modified,
      'article:author': authorName,
      'og:image:width': '1200',
      'og:image:height': '630',
    },
  }
}

export default async function SingleNewsPage({ params }: PageProps) {
  const { post } = await params
  return <SingleNewsContent slug={post} />
}