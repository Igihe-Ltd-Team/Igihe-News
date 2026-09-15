// Google News sitemap: only articles published in the last 48 hours, rolling.
// Generated on request (cheap: a handful of `_fields`-trimmed WordPress calls)
// and revalidated every minute so a new story is visible to Google News fast.

import { NEWS_MAX_AGE_HOURS, NEWS_MAX_URLS, NEWS_PUBLICATION_LANGUAGE, NEWS_PUBLICATION_NAME } from '@/lib/sitemap/config'
import { articleUrl } from '@/lib/sitemap/build'
import { fetchCategories } from '@/lib/sitemap/sources'
import { loadInventory, loadValidationCache } from '@/lib/sitemap/store'
import type { ArticleRecord, ArticleType, NewsSitemapUrl, ValidationCache } from '@/lib/sitemap/types'
import { wpFetchAll } from '@/lib/sitemap/wp'
import { formatLastmod, maxDate, renderNewsUrlset, stripTags } from '@/lib/sitemap/xml'

// Keep in sync with the /news-sitemap.xml Cache-Control rule in next.config.ts.
export const revalidate = 60

const NEWS_ENDPOINTS: Array<{ endpoint: string; type: ArticleType }> = [
  { endpoint: 'posts', type: 'post' },
  { endpoint: 'opinion', type: 'opinion' },
]

interface WpNewsPost {
  id: number
  slug: string
  title?: { rendered?: string }
  date_gmt?: string
  modified_gmt?: string
  categories?: number[]
  status?: string
}

async function fetchRecent(sinceIso: string): Promise<Array<{ record: ArticleRecord; title: string }>> {
  const items: Array<{ record: ArticleRecord; title: string }> = []
  for (const { endpoint, type } of NEWS_ENDPOINTS) {
    let posts: WpNewsPost[] = []
    try {
      posts = await wpFetchAll<WpNewsPost>(
        endpoint,
        {
          _fields: 'id,slug,title,date_gmt,modified_gmt,categories,status',
          after: sinceIso.replace(/\.\d{3}Z$/, ''),
          orderby: 'date',
          order: 'desc',
        },
        { maxPages: Math.ceil(NEWS_MAX_URLS / 100) }
      )
    } catch {
      continue
    }
    for (const post of posts) {
      if (!post.id || !post.slug || (post.status && post.status !== 'publish')) continue
      const date = formatLastmod(post.date_gmt)
      if (!date) continue
      items.push({
        record: {
          id: post.id,
          type,
          slug: post.slug,
          date,
          modified: maxDate(post.date_gmt, post.modified_gmt) ?? date,
          categories: post.categories ?? [],
          bylines: [],
        },
        title: stripTags(post.title?.rendered ?? ''),
      })
    }
  }
  return items.sort((a, b) => b.record.date.localeCompare(a.record.date)).slice(0, NEWS_MAX_URLS)
}

export async function GET() {
  const sinceIso = new Date(Date.now() - NEWS_MAX_AGE_HOURS * 60 * 60 * 1000).toISOString()

  const [inventory, validation, recent] = await Promise.all([
    loadInventory().catch(() => null),
    loadValidationCache().catch((): ValidationCache => ({})),
    fetchRecent(sinceIso),
  ])

  // Category slugs come from the sitemap inventory when it exists (no extra
  // request); otherwise straight from WordPress.
  let categories = inventory?.categories ?? []
  if (categories.length === 0) categories = await fetchCategories().catch(() => [])
  const categorySlugById = new Map(categories.map(category => [category.id, category.slug]))

  const urls: NewsSitemapUrl[] = []
  const seen = new Set<string>()
  for (const { record, title } of recent) {
    const loc = articleUrl(record, categorySlugById)
    if (seen.has(loc)) continue
    seen.add(loc)
    // Anything the sitemap validator has flagged stays out of here too.
    const verdict = validation[loc]
    if (verdict && !verdict.ok) continue
    urls.push({ loc, lastmod: record.modified, title, publicationDate: record.date })
  }

  const xml = renderNewsUrlset(urls, { name: NEWS_PUBLICATION_NAME, language: NEWS_PUBLICATION_LANGUAGE })

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
      'X-Robots-Tag': 'noindex',
    },
  })
}
