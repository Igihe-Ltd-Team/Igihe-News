import { NewsItem } from '@/types/fetchData'
import { stripHtml } from '@/lib/utils'

interface NewsArticleJsonLdProps {
  post: NewsItem
  url: string
}

const BASE_URL = 'https://en.igihe.com'

export default function NewsArticleJsonLd({ post, url }: NewsArticleJsonLdProps) {
  const title = stripHtml(post.title?.rendered || '')
  const description = stripHtml(post.excerpt?.rendered || '').substring(0, 300)

  const image =
    post.featured_image?.url ||
    post._embedded?.['wp:featuredmedia']?.[0]?.source_url

  const authorName = post._embedded?.author?.[0]?.name || post.bylines?.[0]?.name

  const datePublished = post.date_gmt ? `${post.date_gmt}Z` : post.date
  const dateModified = post.modified_gmt ? `${post.modified_gmt}Z` : post.modified

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    ...(description && { description }),
    ...(image && { image: [image] }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    ...(authorName && {
      author: {
        '@type': 'Person',
        name: authorName,
      },
    }),
    publisher: {
      '@type': 'Organization',
      name: 'IGIHE',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/assets/newlogo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }

  return (
    <script
      type="application/ld+json"
      // Escape `<` so a title/description containing "</script>" can't break out of the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
    />
  )
}
