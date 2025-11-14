import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { ApiService } from '@/services/apiService'
import SingleNewsContent from '@/components/news/SingleNewsContent'
import { stripHtml } from '@/lib/utils'
import { useNewsData } from '@/hooks/useNewsData'
import { HydrationBoundary } from '@tanstack/react-query'
import SingleSkeleton from '@/components/Loading/SingleSkeleton'

interface PageProps {
  params: Promise<{ post: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { post } = await params
  try {
    const postData = await ApiService.fetchPostBySlug(post)

    if (!postData) {
      return {
        title: 'Article Not Found',
        description: 'The requested article could not be found.',
      }
    }

    const title = (postData as any).seo_title ||
      (postData as any).yoast_head_json?.title ||
      stripHtml(postData.title.rendered)

    const description = (postData as any).meta_description ||
      (postData as any).yoast_head_json?.description ||
      stripHtml(postData.excerpt.rendered).substring(0, 160)

    const ogImage = (postData as any).yoast_head_json?.og_image?.[0]?.url ||
      postData.featured_media

    return {
      title,
      description,
      keywords: postData.tags?.map(tag => tag.name).join(', '),
      openGraph: {
        title: (postData as any).yoast_head_json?.og_title || title,
        description: (postData as any).yoast_head_json?.og_description || description,
        images: ogImage ? [ogImage] : [],
        type: 'article',
        publishedTime: postData.date,
        modifiedTime: postData.modified,
      },
      twitter: {
        card: 'summary_large_image',
        title: (postData as any).yoast_head_json?.twitter_title || title,
        description: (postData as any).yoast_head_json?.twitter_description || description,
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
    // Generate only a few popular pages statically
    const fetchedPosts = await ApiService.fetchArticles({ 
      per_page: 20, // Reduced for faster builds
      orderby: 'date',
      order: 'desc'
    })
    
    console.log(`Generating ${fetchedPosts.data.length} static pages`)
    return fetchedPosts.data.map((post) => ({ slug: post.slug }))
  } catch (error) {
    console.error('Error in generateStaticParams:', error)
    // Return empty array - other pages will be generated on-demand
    return []
  }
}



export default async function SingleNewsPage({ params }: PageProps) {
  const { post } = await params
  // const post = await ApiService.fetchPostBySlug(slug)
  // const { useArticleDetails } = useNewsData()
  //     const {
  //     article: clientArticle,
  //     // relatedPosts,
  //     // articleLoading,
  //     // refetchArticle
  //   } = useArticleDetails(slug)

  // console.log('post', post)

  // if (!post) notFound()

  return(
    <>
    {/* <SingleSkeleton/> */}
     <SingleNewsContent slug={post}/>
     </>
     )
}