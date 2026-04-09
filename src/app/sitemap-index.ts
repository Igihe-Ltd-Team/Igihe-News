// src/app/sitemap-index.ts
import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://en.igihe.com'

export default function sitemapIndex(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/sitemap/static.xml`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/sitemap/categories.xml`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/sitemap/articles.xml`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/sitemap/videos.xml`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/sitemap/authors.xml`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/sitemap/tags.xml`,
      lastModified: new Date(),
    },
  ]
}