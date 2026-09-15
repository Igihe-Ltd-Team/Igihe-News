import {
  ARTICLES_PER_FILE,
  DEFAULT_POST_SECTION,
  MIN_AUTHOR_POSTS,
  SECTION_BY_TYPE,
  SITE_URL,
  STATIC_PAGES,
  TIERS,
} from './config.ts'
import { getAuthorAliasGroups, isAuthorAlias } from './authors.ts'
import type { ArticleRecord, Inventory, SitemapUrl, Tier, UrlKind, ValidationTarget } from './types.ts'
import { maxDate } from './xml.ts'

export interface Entry extends SitemapUrl, ValidationTarget {
  loc: string
  url: string
  kind: UrlKind
  key: string
}

export interface BuiltEntries {
  pages: Entry[]
  categories: Entry[]
  articles: Entry[]
  videos: Entry[]
  authors: Entry[]
}

function withTier(tier: Tier): Pick<SitemapUrl, 'changefreq' | 'priority'> {
  return { changefreq: TIERS[tier].changefreq, priority: TIERS[tier].priority }
}

function entry(url: string, kind: UrlKind, tier: Tier, lastmod: string | undefined, key: string): Entry {
  return { loc: url, url, kind, key, lastmod, ...withTier(tier) }
}

export function pageUrl(path: string): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path}`
}

export function categoryUrl(slug: string): string {
  return `${SITE_URL}/${slug}`
}

export function videoUrl(slug: string): string {
  return `${SITE_URL}/videos/${slug}`
}

export function authorUrl(slug: string): string {
  return `${SITE_URL}/author/${slug}`
}

/**
 * The first path segment of an article URL. It must be one the article route
 * resolves to the right WordPress endpoint: custom post types have fixed
 * sections; ordinary posts use their first category's slug, which is also
 * what article cards across the site link to.
 */
export function resolveArticleSection(
  record: Pick<ArticleRecord, 'type' | 'categories'>,
  categorySlugById: Map<number, string>
): string {
  if (record.type !== 'post') return SECTION_BY_TYPE[record.type]
  for (const id of record.categories) {
    const slug = categorySlugById.get(id)
    if (slug) return slug
  }
  return DEFAULT_POST_SECTION
}

export function articleUrl(record: ArticleRecord, categorySlugById: Map<number, string>): string {
  return `${SITE_URL}/${resolveArticleSection(record, categorySlugById)}/article/${record.slug}`
}

export interface LatestDates {
  latestArticle?: string
  latestPost?: string
  latestOpinion?: string
  latestAdvertorial?: string
  latestAnnouncement?: string
  latestVideo?: string
  byCategory: Map<number, string>
  byByline: Map<number, string>
}

/** Latest publish time per listing, derived from the inventory (no extra requests). */
export function computeLatestDates(inventory: Inventory): LatestDates {
  const latest: LatestDates = { byCategory: new Map(), byByline: new Map() }
  const bump = (current: string | undefined, candidate: string) =>
    !current || candidate > current ? candidate : current

  for (const article of inventory.articles) {
    latest.latestArticle = bump(latest.latestArticle, article.date)
    if (article.type === 'post') latest.latestPost = bump(latest.latestPost, article.date)
    if (article.type === 'opinion') latest.latestOpinion = bump(latest.latestOpinion, article.date)
    if (article.type === 'advertorial') latest.latestAdvertorial = bump(latest.latestAdvertorial, article.date)
    if (article.type === 'announcement') latest.latestAnnouncement = bump(latest.latestAnnouncement, article.date)
    for (const id of article.categories) latest.byCategory.set(id, bump(latest.byCategory.get(id), article.date))
    for (const id of article.bylines) latest.byByline.set(id, bump(latest.byByline.get(id), article.date))
  }
  for (const video of inventory.videos) latest.latestVideo = bump(latest.latestVideo, video.date)
  return latest
}

export function buildPageEntries(inventory: Inventory, latest = computeLatestDates(inventory)): Entry[] {
  return STATIC_PAGES.map(page => {
    const lastmod = page.lastmodFrom ? latest[page.lastmodFrom] : undefined
    return entry(pageUrl(page.path), 'page', page.tier, lastmod, '')
  })
}

export function buildCategoryEntries(inventory: Inventory, latest = computeLatestDates(inventory)): Entry[] {
  return [...inventory.categories]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map(category => entry(categoryUrl(category.slug), 'category', 'section', latest.byCategory.get(category.id), ''))
}

/** Oldest first so new articles append to the last file and earlier files stay byte-identical. */
export function buildArticleEntries(inventory: Inventory): Entry[] {
  const categorySlugById = new Map(inventory.categories.map(category => [category.id, category.slug]))
  const seen = new Set<string>()
  const sorted = [...inventory.articles].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
  const entries: Entry[] = []
  for (const article of sorted) {
    const url = articleUrl(article, categorySlugById)
    if (seen.has(url)) continue
    seen.add(url)
    entries.push(entry(url, 'article', 'article', article.modified, article.modified))
  }
  return entries
}

export function buildVideoEntries(inventory: Inventory): Entry[] {
  const seen = new Set<string>()
  return [...inventory.videos]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
    .filter(video => (seen.has(video.slug) ? false : (seen.add(video.slug), true)))
    .map(video => entry(videoUrl(video.slug), 'video', 'video', video.modified, video.modified))
}

export interface AuthorSelection {
  slug: string
  name: string
  bylineIds: number[]
  postCount: number
  lastmod?: string
}

/**
 * Authors worth an archive page: alias spellings are folded into their
 * canonical byline, and anything under MIN_AUTHOR_POSTS published articles
 * is dropped. Counts come from the article inventory (all article types),
 * falling back to WordPress's term count when the inventory is empty.
 */
export function selectAuthors(inventory: Inventory, latest = computeLatestDates(inventory)): AuthorSelection[] {
  const countById = new Map<number, number>()
  for (const article of inventory.articles) {
    for (const id of article.bylines) countById.set(id, (countById.get(id) ?? 0) + 1)
  }
  const useInventoryCounts = inventory.articles.length > 0
  const groupByCanonical = new Map(getAuthorAliasGroups().map(group => [group.canonical, group]))

  const selected: AuthorSelection[] = []
  for (const byline of inventory.bylines) {
    if (!byline.slug || isAuthorAlias(byline.slug)) continue
    const group = groupByCanonical.get(byline.slug)
    const ids = [byline.id, ...(group?.aliases.map(alias => alias.id) ?? [])]
    const postCount = useInventoryCounts
      ? ids.reduce((sum, id) => sum + (countById.get(id) ?? 0), 0)
      : byline.count + (group?.aliases.reduce((sum, alias) => sum + alias.count, 0) ?? 0)
    if (postCount < MIN_AUTHOR_POSTS) continue
    selected.push({
      slug: byline.slug,
      name: byline.name,
      bylineIds: ids,
      postCount,
      lastmod: maxDate(...ids.map(id => latest.byByline.get(id))),
    })
  }
  return selected.sort((a, b) => a.slug.localeCompare(b.slug))
}

export function buildAuthorEntries(inventory: Inventory, latest = computeLatestDates(inventory)): Entry[] {
  return selectAuthors(inventory, latest).map(author => entry(authorUrl(author.slug), 'author', 'author', author.lastmod, ''))
}

export function buildEntries(inventory: Inventory): BuiltEntries {
  const latest = computeLatestDates(inventory)
  const pages = buildPageEntries(inventory, latest)
  // WordPress has categories named like static routes (`opinion`, `videos`);
  // the app route wins there, so list the URL once, in sitemap-pages.xml.
  const pageUrls = new Set(pages.map(page => page.loc))
  return {
    pages,
    categories: buildCategoryEntries(inventory, latest).filter(category => !pageUrls.has(category.loc)),
    articles: buildArticleEntries(inventory),
    videos: buildVideoEntries(inventory),
    authors: buildAuthorEntries(inventory, latest),
  }
}

export function chunkArticles<T>(entries: T[], size = ARTICLES_PER_FILE): T[][] {
  if (entries.length === 0) return []
  const chunks: T[][] = []
  for (let i = 0; i < entries.length; i += size) chunks.push(entries.slice(i, i + size))
  return chunks
}
