import { ApiService } from '@/services/apiService'
import { NewsItem } from '@/types/fetchData'
import { buildCategoryMap, withTimeout } from '@/lib/sitemapHelpers'
import { stripHtml } from '@/lib/utils'

export const revalidate = 300

const BASE_URL = 'https://en.igihe.com'
const FETCH_TIMEOUT_MS = 15_000
// Google News only wants articles from roughly the last 48 hours.
const MAX_AGE_HOURS = 48
const MAX_URLS = 1000
const PER_PAGE = 100

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function fetchRecentNewsPosts(sinceIso: string): Promise<NewsItem[]> {
  const posts: NewsItem[] = []

  for (let page = 1; posts.length < MAX_URLS; page++) {
    let response
    try {
      response = await ApiService.fetchArticles({
        page,
        per_page: PER_PAGE,
        after: sinceIso,
        orderby: 'date',
        order: 'desc',
      })
    } catch {
      break
    }

    if (!response?.data?.length) break

    posts.push(...response.data)

    if (!response.pagination?.totalPages || page >= response.pagination.totalPages) break
  }

  return posts.slice(0, MAX_URLS)
}

function buildUrlEntry(post: NewsItem, categorySlug: string): string {
  const loc = `${BASE_URL}/${categorySlug}/article/${post.slug}`
  const title = escapeXml(stripHtml(post.title?.rendered || ''))
  const publicationDate = post.date_gmt ? `${post.date_gmt}Z` : post.date

  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>IGIHE</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${publicationDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`
}

export async function GET() {
  const sinceIso = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000).toISOString()

  const [categoryMap, posts] = await Promise.all([
    withTimeout(buildCategoryMap(), FETCH_TIMEOUT_MS, new Map<number, string>()),
    withTimeout(fetchRecentNewsPosts(sinceIso), 60_000, [] as NewsItem[]),
  ])

  const urlEntries = posts
    .map(post => {
      const categorySlug = categoryMap.get(Number(post.categories?.[0])) ?? 'news'
      return buildUrlEntry(post, categorySlug)
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlEntries}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
