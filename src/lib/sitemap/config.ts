// Sitemap configuration. This module is deliberately dependency-free (no `@/`
// aliases, only relative imports) so the same code runs inside Next.js route
// handlers and under plain `node scripts/sitemap.ts`.

import type { ChangeFreq, Tier } from './types.ts'

// The public origin every sitemap URL is built on. Deliberately NOT derived
// from NEXT_PUBLIC_APP_URL: that is http://localhost:3000 in local .env files,
// and a sitemap full of localhost URLs (or a validator fetching them) must
// never be produced by accident. Override only for a staging host.
export const SITE_URL = (process.env.SITEMAP_SITE_URL || 'https://en.igihe.com').replace(/\/+$/, '')

export function getWordPressApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_WORDPRESS_API_URL
  if (!url) throw new Error('NEXT_PUBLIC_WORDPRESS_API_URL is not configured')
  return url.replace(/\/+$/, '')
}

// Google caps a single sitemap file at 50,000 URLs / 50 MB. Keep a margin.
export const ARTICLES_PER_FILE = Number(process.env.SITEMAP_ARTICLES_PER_FILE) || 40_000

// Author archives with fewer published articles than this are left out of
// the sitemap entirely (thin pages; most of the 1,500+ bylines are one-offs).
export const MIN_AUTHOR_POSTS = Number(process.env.SITEMAP_MIN_AUTHOR_POSTS) || 5

// Google News only wants articles from the last two days.
export const NEWS_MAX_AGE_HOURS = 48
export const NEWS_MAX_URLS = 1000
export const NEWS_PUBLICATION_NAME = 'IGIHE'
export const NEWS_PUBLICATION_LANGUAGE = 'en'

// Simple, realistic tiers. Google ignores these as ranking signals; they are
// kept because they cost nothing to emit. Do not tune further.
export const TIERS: Record<Tier, { priority: number; changefreq: ChangeFreq }> = {
  home:    { priority: 1.0, changefreq: 'hourly' },
  feed:    { priority: 0.8, changefreq: 'hourly' },  // /articles — the latest-news feed
  section: { priority: 0.8, changefreq: 'daily' },   // category and section listing pages
  article: { priority: 0.6, changefreq: 'daily' },
  video:   { priority: 0.6, changefreq: 'weekly' },
  utility: { priority: 0.4, changefreq: 'weekly' },  // /author index, /services
  author:  { priority: 0.3, changefreq: 'monthly' }, // author archives
}

// Where each static page takes its lastmod from. `null` means the page has no
// data-driven modification time, so no <lastmod> is emitted for it rather than
// inventing one.
export type StaticLastmodSource =
  | 'latestArticle'
  | 'latestPost'
  | 'latestVideo'
  | 'latestOpinion'
  | 'latestAdvertorial'
  | 'latestAnnouncement'
  | null

export interface StaticPageConfig {
  path: string
  tier: Tier
  lastmodFrom: StaticLastmodSource
}

export const STATIC_PAGES: StaticPageConfig[] = [
  { path: '/',              tier: 'home',    lastmodFrom: 'latestArticle' },
  { path: '/articles',      tier: 'feed',    lastmodFrom: 'latestPost' },
  { path: '/videos',        tier: 'section', lastmodFrom: 'latestVideo' },
  { path: '/opinion',       tier: 'section', lastmodFrom: 'latestOpinion' },
  { path: '/advertorials',  tier: 'section', lastmodFrom: 'latestAdvertorial' },
  { path: '/announcements', tier: 'section', lastmodFrom: 'latestAnnouncement' },
  { path: '/author',        tier: 'utility', lastmodFrom: null },
  { path: '/services',      tier: 'utility', lastmodFrom: null },
]

// The article route (`/[category]/article/[post]`) picks its WordPress
// endpoint from the first path segment. Custom post types therefore have a
// fixed section segment; ordinary posts use their first category's slug.
export const SECTION_BY_TYPE: Record<'opinion' | 'advertorial' | 'announcement', string> = {
  opinion: 'opinion',
  advertorial: 'advertorials',
  announcement: 'announcements',
}
export const DEFAULT_POST_SECTION = 'news'

export const VALIDATION = {
  // Max URLs fetched per regeneration run. Everything else is cached from
  // earlier runs or left pending; see docs/sitemaps.md.
  budgetPerRun: Number(process.env.SITEMAP_VALIDATE_BUDGET ?? 300),
  concurrency: Number(process.env.SITEMAP_VALIDATE_CONCURRENCY ?? 4),
  timeoutMs: 15_000,
  // How long a passing check stays valid before the URL is re-fetched.
  ttlMs: {
    article: 30 * 24 * 60 * 60 * 1000,
    video: 7 * 24 * 60 * 60 * 1000,
    other: 7 * 24 * 60 * 60 * 1000,
  },
  // A failed check is retried after this long (until then the URL stays out).
  retryFailedAfterMs: 6 * 60 * 60 * 1000,
  // Article URLs that have never been fetched are still emitted (they are
  // published in WordPress and their route is deterministic). Set to "false"
  // to hold every URL back until it has passed an HTTP check.
  includeUnvalidated: (process.env.SITEMAP_INCLUDE_UNVALIDATED ?? 'true') !== 'false',
  // Outage guard. If more than this share of a run's checks fail for
  // transport reasons (network errors, 5xx, 429, 403), or nearly every check
  // fails for any reason, assume the validator or the site is broken and do
  // not record the failures as exclusions.
  maxTransientFailureRatio: 0.5,
  maxTotalFailureRatio: 0.9,
  minChecksForRatio: 20,
  userAgent: process.env.SITEMAP_VALIDATOR_UA || 'IGIHE-SitemapValidator/1.0 (+https://en.igihe.com/sitemap-index.xml)',
  alertWebhookUrl: process.env.SITEMAP_ALERT_WEBHOOK_URL || '',
}

export const SCHEDULE = {
  // Coalesce bursts of publish webhooks into one regeneration.
  debounceMs: Number(process.env.SITEMAP_DEBOUNCE_MS ?? 20_000),
  maxWaitMs: 2 * 60 * 1000,
  incrementalEveryMs: 60 * 60 * 1000,
  fullSyncEveryMs: 24 * 60 * 60 * 1000,
  // Incremental syncs re-fetch this much older than the last sync so clock
  // skew / WordPress local-time comparisons can't drop an update.
  incrementalOverlapMs: 6 * 60 * 60 * 1000,
  // On a cold start, publish a sitemap from recent content first, then backfill.
  coldStartWindowMs: 30 * 24 * 60 * 60 * 1000,
}

export const WP_FETCH = {
  perPage: 100,
  concurrency: Number(process.env.SITEMAP_WP_CONCURRENCY ?? 3),
  timeoutMs: 45_000,
  retries: 3,
}
