// src/app/robots.ts
import { MetadataRoute } from 'next'
import { ROBOTS_DISALLOW, ROBOTS_SITEMAP_PATHS } from '@/lib/sitemap/robotsRules'

const BASE_URL = 'https://en.igihe.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ROBOTS_DISALLOW,
    },
    // The index references every child sitemap (pages, categories, articles,
    // videos, authors) plus the news sitemap; the news sitemap is listed on
    // its own as well so Google News picks it up directly.
    sitemap: ROBOTS_SITEMAP_PATHS.map(path => `${BASE_URL}${path}`),
    host: BASE_URL,
  }
}
