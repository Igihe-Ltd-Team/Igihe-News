import { cache } from 'react'
import { Suspense } from 'react'
import SingleNewsContent from '@/components/news/SingleNewsContent'
import { stripHtml } from '@/lib/utils'
import { ApiService } from '@/services/apiService'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import HydrateArticle from './HydrateArticle'
import { Container } from 'react-bootstrap'
import CustomSlider from '@/components/home/CustomSlider'
import ServerSlotManager from '@/components/ads/ServerSlotManager'

interface PageProps {
  params: Promise<{ post: string, category: string }>
}

/* ------------------------ ENDPOINTS ------------------------ */
const endpoints: Record<string, string> = {
  opinion: "opinion",
  'rubrique-19': "opinion",
  advertorials: "advertorial",
  facts: "facts",
  announcements: 'announcement'
}

/* ------------------------ CACHED FETCH POST ------------------------ */
// Cache deduplicates requests during the same render cycle
const getPostData = cache(async (slug: string, section: string) => {
  const endpoint = endpoints[section] ?? "posts"
  const api = `${endpoint}?slug=${slug}&_embed`

  try {
    if (section === 'posts') {
      return await ApiService.fetchPostBySlug(slug)
    } else {
      return await ApiService.customPostFetch(api, slug)
    }
  } catch (error) {
    console.error('❌ Fetch error:', error)
    return null
  }
})

/* ------------------------ METADATA ------------------------ */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { post: slug, category } = await params

  // Capitalize slug for fallback title
  const fallbackTitle = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  const mergeTrafficOther = (
    existingOther: Metadata['other'] | undefined,
    contentId: string | number,
    pageTitle: string
  ): Record<string, string | number | Array<string | number>> => {
    const merged: Record<string, string | number | Array<string | number>> = {}

    if (existingOther) {
      for (const [key, value] of Object.entries(existingOther as Record<string, unknown>)) {
        if (typeof value === 'string' || typeof value === 'number') {
          merged[key] = value
          continue
        }

        if (Array.isArray(value) && value.every((item) => typeof item === 'string' || typeof item === 'number')) {
          merged[key] = value as Array<string | number>
        }
      }
    }

    merged['traffic:property_id'] = 'igihe-en'
    merged['traffic:content_id'] = String(contentId)
    merged['traffic:title'] = pageTitle
    return merged
  }

  try {
    // This will use cached data from the page render
    const postData = await getPostData(slug, category)

    // If no post data, return simple metadata
    if (!postData) {
      const baseMetadata: Metadata = {
        title: `${fallbackTitle} | IGIHE`,
        description: 'Latest news from IGIHE Rwanda'
      }
      return {
        ...baseMetadata,
        other: mergeTrafficOther(baseMetadata.other, slug, fallbackTitle),
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
      postData.yoast_head_json?.og_image?.[0]?.url || postData.featured_image?.url ||
      postData._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''

    // Extract author safely
    const author = postData._embedded?.author?.[0]?.name

    // Build clean metadata
    const baseMetadata: Metadata = {
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
    return {
      ...baseMetadata,
      other: mergeTrafficOther(baseMetadata.other, postData.id ?? slug, title || fallbackTitle),
    }

  } catch (error) {
    console.error('❌ Metadata error:', error)
    const baseMetadata: Metadata = {
      title: `${fallbackTitle} | IGIHE`,
      description: 'Latest news from IGIHE Rwanda'
    }
    return {
      ...baseMetadata,
      other: mergeTrafficOther(baseMetadata.other, slug, fallbackTitle),
    }
  }
}

/* ------------------------ PAGE ------------------------ */
export default async function SingleNewsPage({ params }: PageProps) {
  const { post: slug, category } = await params

  return (
    <Suspense key={slug} fallback={<ArticleSkeleton />}>
      <ArticleContent slug={slug} category={category} />
    </Suspense>
  )
}

/* ------------------------ ARTICLE CONTENT ------------------------ */
async function ArticleContent({
  slug,
  category
}: {
  slug: string
  category: string
}) {
  // This will use cached data from generateMetadata
  const postData = await getPostData(slug, category)

  // Handle 404 if no post found
  if (!postData) {
    notFound()
  }

  return (
    <HydrateArticle article={postData} slug={slug}>
      {/* <ViewTrackerComponent postId={postData.id} /> */}

      <div className='pb-md-4'>
        <Suspense fallback={null}>
          <Container>
            <CustomSlider
              lgDisplay={2}
              mdDisplay={2}
              smDisplay={1}
            >
              <Suspense fallback={null}>
                <ServerSlotManager
                  position="above-latest-news-1"
                  priority={true}
                />
              </Suspense>
              <Suspense fallback={null}>
                <ServerSlotManager
                  position="above-latest-news-2"
                  priority={true}
                />
              </Suspense>
            </CustomSlider>
          </Container>
        </Suspense>
      </div>
      <SingleNewsContent slug={slug} initialArticle={postData} />
    </HydrateArticle>
  )
}

/* ------------------------ LOADING SKELETON ------------------------ */
function ArticleSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      {/* Title skeleton */}
      <div className="h-10 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
      <div className="h-10 bg-gray-200 rounded-lg w-2/3 mb-6"></div>

      {/* Meta info skeleton */}
      <div className="flex gap-4 mb-6">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Image skeleton */}
      <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>

      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  )
}