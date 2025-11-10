import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { ApiService } from '@/services/apiService'
import SingleNewsContent from '@/components/news/SingleNewsContent'
import { stripHtml } from '@/lib/utils'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const post = await ApiService.fetchPostBySlug(slug)

    if (!post) {
      return {
        title: 'Article Not Found',
        description: 'The requested article could not be found.',
      }
    }

    const title = (post as any).seo_title ||
      (post as any).yoast_head_json?.title ||
      stripHtml(post.title.rendered)

    const description = (post as any).meta_description ||
      (post as any).yoast_head_json?.description ||
      stripHtml(post.excerpt.rendered).substring(0, 160)

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
    // Generate only a few popular pages statically
    const posts = await ApiService.fetchArticles({ 
      per_page: 20, // Reduced for faster builds
      orderby: 'date',
      order: 'desc'
    })
    
    console.log(`Generating ${posts.data.length} static pages`)
    return posts.data.map((post) => ({ slug: post.slug }))
  } catch (error) {
    console.error('Error in generateStaticParams:', error)
    // Return empty array - other pages will be generated on-demand
    return []
  }
}



export default async function SingleNewsPage({ params }: PageProps) {
  const { slug } = await params
  const post = await ApiService.fetchPostBySlug(slug)

  console.log('post', post)

  if (!post) notFound()

  return <SingleNewsContent slug={slug} initialArticle={post} />
}