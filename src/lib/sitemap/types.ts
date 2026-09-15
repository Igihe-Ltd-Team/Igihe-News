export type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

export type Tier = 'home' | 'feed' | 'section' | 'article' | 'video' | 'utility' | 'author'

export type UrlKind = 'page' | 'category' | 'article' | 'video' | 'author'

export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: ChangeFreq
  priority?: number
}

export interface SitemapFileRef {
  loc: string
  lastmod?: string
}

export interface NewsSitemapUrl {
  loc: string
  lastmod?: string
  title: string
  publicationDate: string
}

export type ArticleType = 'post' | 'opinion' | 'advertorial' | 'announcement'

export interface ArticleRecord {
  id: number
  type: ArticleType
  slug: string
  /** ISO 8601 UTC publish time */
  date: string
  /** ISO 8601 UTC last-modified time */
  modified: string
  categories: number[]
  bylines: number[]
}

export interface VideoRecord {
  id: number
  slug: string
  date: string
  modified: string
}

export interface CategoryRecord {
  id: number
  slug: string
  name: string
  count: number
}

export interface BylineRecord {
  id: number
  slug: string
  name: string
  count: number
}

export interface Inventory {
  version: 1
  /** When the article inventory was last brought up to date (full or incremental). */
  syncedAt: string | null
  /** When the last complete re-sync of every article finished. */
  fullSyncAt: string | null
  articles: ArticleRecord[]
  videos: VideoRecord[]
  categories: CategoryRecord[]
  bylines: BylineRecord[]
}

export interface ManifestFile {
  /** Store file name without extension, e.g. `articles-1`. */
  name: string
  /** Public path, e.g. `/sitemap-articles-1.xml`. */
  path: string
  urlCount: number
  /** SHA-256 of the XML body, used to keep lastmod stable when nothing changed. */
  hash: string
  /** When the file's content last changed — what the index reports as lastmod. */
  lastmod: string
  /** When the file was last written (may be newer than lastmod). */
  generatedAt: string
}

export interface RunInfo {
  mode: 'full' | 'incremental'
  reason: string
  startedAt: string
  finishedAt: string
  durationMs: number
  ok: boolean
  error?: string
}

export interface ExcludedUrl {
  url: string
  kind: UrlKind
  reason: string
  /** True when this URL failed validation but was kept anyway (see the
   * mass-exclusion guard in generate.ts) rather than dropped from the sitemap. */
  guarded?: boolean
}

export interface ValidationSummary {
  /** URLs fetched during this run. */
  checked: number
  /** URLs actually dropped from a sitemap because their check failed. */
  excluded: number
  /** URLs emitted without a passing HTTP check yet. */
  pending: number
  /** Entries with a passing verdict that did not need a fetch this run. */
  cached: number
  /** Failing URLs, both dropped (guarded: false) and kept in the sitemap
   * anyway because dropping all of them looked systemic (guarded: true). */
  excludedUrls: ExcludedUrl[]
  /** Set when the run's failure ratio was abnormal and failures were discarded. */
  aborted?: string
}

export interface Manifest {
  version: 1
  generatedAt: string
  files: Record<string, ManifestFile>
  articleFileCount: number
  validation: ValidationSummary | null
  lastRun: RunInfo | null
}

export interface ValidationResult {
  url: string
  kind: UrlKind
  ok: boolean
  status?: number
  reason?: string
  checkedAt: string
  /** Content key (lastmod) the check was made against; a change forces a re-check. */
  key: string
}

export type ValidationCache = Record<string, ValidationResult>

export interface ValidationTarget {
  url: string
  kind: UrlKind
  key: string
}

export interface ArticleRemoval {
  type: ArticleType | 'video'
  slug?: string
  id?: number
}

export interface Logger {
  info: (message: string, ...rest: unknown[]) => void
  warn: (message: string, ...rest: unknown[]) => void
  error: (message: string, ...rest: unknown[]) => void
}

export interface AuthorAliasMember {
  slug: string
  id: number
  name: string
  count: number
}

export interface AuthorAliasGroup {
  canonical: string
  canonicalId: number
  name: string
  confidence: 'exact' | 'typo' | 'fuzzy'
  aliases: AuthorAliasMember[]
}

export interface AuthorAliasData {
  version: 1
  generatedAt: string
  groups: AuthorAliasGroup[]
}
