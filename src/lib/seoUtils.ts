export function generateArticleStructuredData(postData: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: postData.title?.rendered || '',
    description: postData.excerpt?.rendered || '',
    image: postData.featured_media || '',
    datePublished: postData.date,
    dateModified: postData.modified,
    author: {
      '@type': 'Person',
      name: postData.author_data?.name || '',
    },
    publisher: {
      '@type': 'Organization',
      name: 'IGIHE',
      logo: {
        '@type': 'ImageObject',
        url: '/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_APP_URL}/news/news/${postData.slug}`,
    },
  }
}