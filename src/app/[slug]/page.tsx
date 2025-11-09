import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { ApiService } from '@/services/apiService'
import SingleNewsContent from '@/components/news/SingleNewsContent'
import { queryKeys } from '@/lib/queryKeys'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/react-query'
import { NewsItem } from '@/types/fetchData'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: { [key: string]: string | string[] | undefined }
}



export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const {slug} = await params
  try {
    const post = await ApiService.fetchPostBySlug(slug)

    if (!post) {
      return {
        title: 'Article Not Found',
        description: 'The requested article could not be found.',
      }
    }

    // Safe access to SEO properties with fallbacks
    const title = (post as any).seo_title ||
      (post as any).yoast_head_json?.title ||
      post.title.rendered.replace(/<[^>]*>/g, '')

    const description = (post as any).meta_description ||
      (post as any).yoast_head_json?.description ||
      post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 160)

    const ogImage = (post as any).yoast_head_json?.og_image?.[0]?.url ||
      post.featured_media

    return {
      title,
      description,
      keywords: post.tags?.map(tag => tag.name).join(', '),
      openGraph: {
        title: (post as any).yoast_head_json?.og_title || title,
        description: (post as any).yoast_head_json?.og_description || description,
        images: ogImage ? [ogImage] : [],
        type: 'article',
        publishedTime: post.date,
        modifiedTime: post.modified,
      },
      twitter: {
        card: 'summary_large_image',
        title: (post as any).yoast_head_json?.twitter_title || title,
        description: (post as any).yoast_head_json?.twitter_description || description,
        images: ogImage ? [ogImage] : [],
      },
    }
  } catch (error) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.',
    }
  }
}



export async function generateStaticParams() {
  try {
    const posts = await ApiService.fetchArticles({ per_page: 100 })
    return posts.data.map((post) => ({
      slug: post.slug,
    }))
  } catch (error) {
    return []
  }
}

export default async function SingleNewsPage({ params }: PageProps) {
  const queryClient = getQueryClient()
  const { slug } = await params
  try {
    // Validate slug parameter
    if (!slug || typeof slug !== 'string') {
      notFound()
    }

    // Prefetch the post data with proper error handling
    await queryClient.prefetchQuery({
      queryKey: queryKeys.articles.detail(slug),
      queryFn: async () => {
        const post = await ApiService.fetchPostBySlug(slug)

        // Ensure we never return undefined
        if (!post) {
          throw new Error('Post not found')
        }

        return post
      },
    })

    // Get the post to check if it exists and prefetch related posts
    const post = await queryClient.getQueryData<NewsItem>(
      queryKeys.articles.detail(slug)
    )

    if (!post) {
      notFound()
    }

    // Prefetch related posts only if we have a valid post
    await queryClient.prefetchQuery({
      queryKey: queryKeys.articles.related(String(post.id), post.categories?.[0]?.id),
      queryFn: () => ApiService.fetchRelatedPosts(String(post.id), [post?.categories?.[0]?.id]),
    })

    const dehydratedState = dehydrate(queryClient)

    return (
      <HydrationBoundary state={dehydratedState}>
        <SingleNewsContent slug={slug} />
      </HydrationBoundary>
    )
  } catch (error) {
    console.error('Error in SingleNewsPage:', error)
    notFound()
  }
}