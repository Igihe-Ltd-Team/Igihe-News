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

  try {
    let postData = await getCachedPost(post)

    if (!postData) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      postData = await ApiService.fetchPostBySlug(post)
      clearTimeout(timeoutId)
    }

    if (!postData) {
      return {
        title: "Article Not Found",
        description: "The requested article could not be found.",
      }
    }

    /* ------------------------ TITLE + DESCRIPTION ------------------------ */
    const rawTitle =
      postData?.yoast_head_json?.title ||
      postData?.title?.rendered ||
      "News Article"

    const rawDescription =
      postData?.yoast_head_json?.description ||
      postData?.excerpt?.rendered ||
      ""

    const title = stripHtml(rawTitle)
    const description = stripHtml(rawDescription).substring(0, 160)

    /* ------------------------ IMAGE ------------------------ */
    const ogImage =
      postData?.yoast_head_json?.og_image?.[0]?.url ||
      postData?._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
      undefined

    /* ------------------------ AUTHOR ------------------------ */
    const author =
      postData?._embedded?.author?.[0]?.name ||
      postData?.author ||
      undefined

    /* ------------------------ FINAL METADATA ------------------------ */
    return {
      title,
      description,
      keywords:
        postData?.tags?.length
          ? postData.tags.map((t: Tag) => t.name).join(', ')
          : undefined,

      alternates: {
        canonical: postData?.link || `https://stage.igihe.com/news/news/${post}`
      },

      openGraph: {
        type: 'article',
        title: postData?.yoast_head_json?.og_title || title,
        description: postData?.yoast_head_json?.og_description || description,
        url: postData?.link,
        siteName: 'IGIHE',
        locale: postData?.yoast_head_json?.og_locale || 'en_US',
        publishedTime: postData?.date,
        modifiedTime: postData?.modified,

        images: ogImage ? [{ url: ogImage, alt: title }] : [],
        
      },

      twitter: {
        card: 'summary_large_image',
        title: postData?.yoast_head_json?.twitter_title || title,
        description: postData?.yoast_head_json?.twitter_description || description,
        images: ogImage ? [ogImage] : []
      },

      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1
        }
      }
    }
  } catch (error) {
    console.error("Metadata error:", error)

    return {
      title: `${post.replace(/-/g, ' ')} | igihe.com`,
      description: "Latest news updates",
      robots: { index: false }
    }
  }
}

/* ------------------------ PAGE ------------------------ */
export default async function SingleNewsPage({ params }: PageProps) {
  const { post } = await params
  return <SingleNewsContent slug={post} />
}