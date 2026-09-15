import type { ArticleRecord, ArticleType, BylineRecord, CategoryRecord, Inventory, Logger, VideoRecord } from './types.ts'
import { formatLastmod, maxDate } from './xml.ts'
import { wpFetchAll } from './wp.ts'

const ARTICLE_ENDPOINTS: Array<{ endpoint: string; type: ArticleType }> = [
  { endpoint: 'posts', type: 'post' },
  { endpoint: 'opinion', type: 'opinion' },
  { endpoint: 'advertorial', type: 'advertorial' },
  { endpoint: 'announcement', type: 'announcement' },
]

const ARTICLE_FIELDS = 'id,slug,date_gmt,modified_gmt,categories,byline,status,type'

interface WpArticle {
  id: number
  slug: string
  date_gmt?: string
  modified_gmt?: string
  categories?: number[]
  byline?: number[]
  status?: string
}

interface WpTerm {
  id: number
  slug: string
  name: string
  count: number
}

function toArticleRecord(raw: WpArticle, type: ArticleType): ArticleRecord | null {
  if (!raw?.id || !raw.slug) return null
  if (raw.status && raw.status !== 'publish') return null
  const date = formatLastmod(raw.date_gmt)
  if (!date) return null
  // Scheduled posts carry a modified_gmt older than their publish time.
  const modified = maxDate(raw.date_gmt, raw.modified_gmt) ?? date
  return {
    id: raw.id,
    type,
    slug: raw.slug,
    date,
    modified,
    categories: Array.isArray(raw.categories) ? raw.categories.map(Number) : [],
    bylines: Array.isArray(raw.byline) ? raw.byline.map(Number) : [],
  }
}

export async function fetchCategories(): Promise<CategoryRecord[]> {
  const terms = await wpFetchAll<WpTerm>('categories', { _fields: 'id,slug,name,count', orderby: 'id', order: 'asc' })
  return terms.filter(term => term.count > 0).map(term => ({ id: term.id, slug: term.slug, name: term.name, count: term.count }))
}

export async function fetchBylines(): Promise<BylineRecord[]> {
  const terms = await wpFetchAll<WpTerm>('byline', { _fields: 'id,slug,name,count', orderby: 'id', order: 'asc' })
  return terms.map(term => ({ id: term.id, slug: term.slug, name: term.name, count: term.count }))
}

export async function fetchVideos(): Promise<VideoRecord[]> {
  const raw = await wpFetchAll<WpArticle>('igh-yt-videos', {
    _fields: 'id,slug,date_gmt,modified_gmt,status',
    orderby: 'id',
    order: 'asc',
  })
  return raw
    .filter(video => video.id && video.slug && (!video.status || video.status === 'publish'))
    .map(video => {
      const date = formatLastmod(video.date_gmt) ?? formatLastmod(new Date(0))!
      return { id: video.id, slug: video.slug, date, modified: maxDate(video.date_gmt, video.modified_gmt) ?? date }
    })
}

export interface ArticleSyncOptions {
  /** ISO timestamp; only articles modified after this are fetched. */
  modifiedAfter?: string
  log?: Logger
}

/**
 * Fetches article records for every article-like post type. Without
 * `modifiedAfter` this is a complete sweep (hundreds of requests for the
 * posts endpoint); with it, WordPress returns only what changed.
 */
export async function fetchArticles(options: ArticleSyncOptions = {}): Promise<ArticleRecord[]> {
  const records: ArticleRecord[] = []
  for (const { endpoint, type } of ARTICLE_ENDPOINTS) {
    const params: Record<string, string> = { _fields: ARTICLE_FIELDS, orderby: 'id', order: 'asc' }
    if (options.modifiedAfter) {
      // WordPress compares against the site-local modified time, so pass a
      // zone-less timestamp; callers add an overlap margin to be safe.
      params.modified_after = options.modifiedAfter.replace(/\.\d{3}Z$/, '').replace(/Z$/, '')
    }
    let pagesSeen = 0
    const raw = await wpFetchAll<WpArticle>(endpoint, params, {
      onPage: info => {
        pagesSeen++
        if (options.log && (pagesSeen % 50 === 0 || info.page === info.totalPages)) {
          options.log.info(`[sitemap] ${endpoint}: page ${info.page}/${info.totalPages}`)
        }
      },
    })
    for (const item of raw) {
      const record = toArticleRecord(item, type)
      if (record) records.push(record)
    }
  }
  return records
}

export function emptyInventory(): Inventory {
  return { version: 1, syncedAt: null, fullSyncAt: null, articles: [], videos: [], categories: [], bylines: [] }
}

export function articleKey(record: Pick<ArticleRecord, 'type' | 'id'>): string {
  return `${record.type}:${record.id}`
}

/** Upserts by (type, id) so re-fetched records replace older copies. */
export function mergeArticles(existing: ArticleRecord[], incoming: ArticleRecord[]): ArticleRecord[] {
  const byKey = new Map(existing.map(record => [articleKey(record), record]))
  for (const record of incoming) byKey.set(articleKey(record), record)
  return [...byKey.values()]
}
