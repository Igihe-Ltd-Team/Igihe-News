// app/news/news/[post]/page.tsx
import SingleNewsContent from '@/components/news/SingleNewsContent'
import { stripHtml } from '@/lib/utils'
import { ApiService } from '@/services/apiService'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ post: string, category: string }>
}

/* ------------------------ STRIP HTML ------------------------ */

const endpoints: Record<string, string> = {
  opinion: "opinion",
  'rubrique-19': "opinion",
  
  advertorials: "advertorial",
  facts: "facts",
};
/* ------------------------ FETCH POST ------------------------ */
async function getPostData(slug: string, section: string) {
  const endpoint = endpoints[section] ?? "posts";
  const apiUrl = `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL}/${endpoint}?slug=${slug}&_embed`;
  const api = `${endpoint}?slug=${slug}&_embed`;

  try {

    if (section === 'posts') {
      return await ApiService.fetchPostBySlug(slug)
    }
    else
    {
     return await ApiService.customPostFetch(api)
    }

    // const response = await fetch(
    //   apiUrl,
    //   {
    //     next: { revalidate: 60 },
    //     // cache: 'no-store' // Force fresh data
    //   }
    // )

    // if (!response.ok) return null

    // const posts = await response.json()
    // return posts && posts.length > 0 ? posts[0] : null

  } catch (error) {
    console.error('❌ Fetch error:', error)
    return null
  }
}

/* ------------------------ METADATA ------------------------ */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { post: slug, category } = await params

  // Capitalize slug for fallback title
  const fallbackTitle = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  try {
    const postData = await getPostData(slug, category)

    // If no post data, return simple metadata
    if (!postData) {
      return {
        title: `${fallbackTitle} | IGIHE`,
        description: 'Latest news from IGIHE Rwanda'
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
      postData.yoast_head_json?.og_image?.[0]?.url ||
      postData._embedded?.['wp:featuredmedia']?.[0]?.source_url

    // Extract author safely
    const author = postData._embedded?.author?.[0]?.name

    // Build clean metadata
    return {
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

  } catch (error) {
    console.error('❌ Metadata error:', error)
    // Return basic metadata on error (NOT "Article Not Found")
    return {
      title: `${fallbackTitle} | IGIHE`,
      description: 'Latest news from IGIHE Rwanda'
    }
  }
}

/* ------------------------ PAGE ------------------------ */
export default async function SingleNewsPage({ params }: PageProps) {
  const { post: slug, category } = await params
  // console.log('category',category)

  const postData = await getPostData(slug, category)
  return <SingleNewsContent slug={slug} initialArticle={postData} />
}