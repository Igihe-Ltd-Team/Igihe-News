import { ARTICLES_PER_FILE, NEWS_PUBLICATION_LANGUAGE, SCHEDULE, SITE_URL, VALIDATION } from './config.ts'
import { buildEntries, chunkArticles, computeLatestDates, type Entry } from './build.ts'
import { articleKey, fetchArticles, fetchBylines, fetchCategories, fetchVideos, mergeArticles } from './sources.ts'
import {
  loadInventory,
  loadManifest,
  loadValidationCache,
  publicSitemapPath,
  removeStoreFile,
  REPORT_FILE,
  saveInventory,
  saveManifest,
  saveValidationCache,
  sha256,
  sitemapFileName,
  writeFileAtomic,
} from './store.ts'
import type {
  ArticleRemoval,
  ExcludedUrl,
  Inventory,
  Logger,
  Manifest,
  ManifestFile,
  RunInfo,
  SitemapFileRef,
  ValidationCache,
  ValidationSummary,
} from './types.ts'
import { classify, runValidation } from './validate.ts'
import { formatLastmod, renderSitemapIndex, renderUrlset, XML_DECLARATION } from './xml.ts'

export interface RegenerateOptions {
  mode: 'full' | 'incremental'
  reason?: string
  /** Run HTTP validation (default true). */
  validate?: boolean
  validationBudget?: number
  /** Override the incremental window (ISO timestamp). */
  modifiedAfter?: string
  removals?: ArticleRemoval[]
  log?: Logger
}

export interface RegenerationReport {
  run: RunInfo
  files: ManifestFile[]
  counts: { pages: number; categories: number; articles: number; videos: number; authors: number }
  validation: ValidationSummary | null
  inventory: { articles: number; videos: number; categories: number; bylines: number; syncedAt: string | null; fullSyncAt: string | null }
  changedFiles: string[]
}

const silentLogger: Logger = { info: () => {}, warn: () => {}, error: () => {} }

export const consoleLogger: Logger = {
  info: (message, ...rest) => console.log(message, ...rest),
  warn: (message, ...rest) => console.warn(message, ...rest),
  error: (message, ...rest) => console.error(message, ...rest),
}

function applyRemovals(inventory: Inventory, removals: ArticleRemoval[]): number {
  if (!removals.length) return 0
  const before = inventory.articles.length + inventory.videos.length
  for (const removal of removals) {
    if (removal.type === 'video') {
      inventory.videos = inventory.videos.filter(video => !(removal.id && video.id === removal.id) && !(removal.slug && video.slug === removal.slug))
      continue
    }
    inventory.articles = inventory.articles.filter(article => {
      if (article.type !== removal.type) return true
      if (removal.id && article.id === removal.id) return false
      if (removal.slug && article.slug === removal.slug) return false
      return true
    })
  }
  return before - (inventory.articles.length + inventory.videos.length)
}

async function syncInventory(inventory: Inventory, options: RegenerateOptions, startedAt: Date, log: Logger): Promise<Inventory> {
  const [categories, bylines, videos] = await Promise.all([fetchCategories(), fetchBylines(), fetchVideos()])
  const next: Inventory = { ...inventory, categories, bylines, videos }

  if (options.mode === 'full') {
    log.info('[sitemap] full article sync started')
    next.articles = await fetchArticles({ log })
    next.fullSyncAt = startedAt.toISOString()
  } else {
    const sinceMs = options.modifiedAfter
      ? Date.parse(options.modifiedAfter)
      : inventory.syncedAt
        ? Date.parse(inventory.syncedAt) - SCHEDULE.incrementalOverlapMs
        : startedAt.getTime() - SCHEDULE.coldStartWindowMs
    const modifiedAfter = new Date(sinceMs).toISOString()
    log.info(`[sitemap] incremental article sync since ${modifiedAfter}`)
    const changed = await fetchArticles({ modifiedAfter, log })
    next.articles = mergeArticles(inventory.articles, changed)
    log.info(`[sitemap] ${changed.length} changed article(s) merged`)
  }

  const removed = applyRemovals(next, options.removals ?? [])
  if (removed) log.info(`[sitemap] ${removed} record(s) removed after publish webhook`)

  // Guard against duplicate ids that could slip in through overlapping syncs.
  next.articles = mergeArticles([], next.articles)
  next.syncedAt = startedAt.toISOString()
  return next
}

interface RenderedFile {
  name: string
  xml: string
  urlCount: number
}

function renderFiles(entries: ReturnType<typeof buildEntries>): RenderedFile[] {
  const files: RenderedFile[] = [
    { name: 'pages', xml: renderUrlset(entries.pages), urlCount: entries.pages.length },
    { name: 'categories', xml: renderUrlset(entries.categories), urlCount: entries.categories.length },
  ]
  chunkArticles(entries.articles, ARTICLES_PER_FILE).forEach((chunk, index) => {
    files.push({ name: `articles-${index + 1}`, xml: renderUrlset(chunk), urlCount: chunk.length })
  })
  files.push(
    { name: 'videos', xml: renderUrlset(entries.videos), urlCount: entries.videos.length },
    { name: 'authors', xml: renderUrlset(entries.authors), urlCount: entries.authors.length }
  )
  return files
}

function filterEntries(entries: Entry[], cache: ValidationCache, excluded: ExcludedUrl[], pending: { count: number }): Entry[] {
  return entries.filter(item => {
    const state = classify(item, cache)
    if (state === 'ok') return true
    if (state === 'excluded') {
      excluded.push({ url: item.url, kind: item.kind, reason: cache[item.url]?.reason ?? 'failed validation' })
      return false
    }
    pending.count++
    return VALIDATION.includeUnvalidated
  })
}

/**
 * Applies validation to one collection, with a guard against a single run
 * wiping out a file that previously carried real content: if every entry in
 * a previously non-trivial collection fails at once — a bad canonical
 * pushed live, a WAF rule, a validator regression — that is a systemic
 * problem, not 87 individually bad pages, and must not silently empty
 * sitemap-videos.xml (or any other file). When that happens the whole
 * collection is kept unfiltered for this run (still listed, still logged
 * and alerted as failing) instead of dropped, so the same content stays
 * discoverable until whatever broke is fixed and the URLs pass again.
 */
export function applyValidation(
  entries: Entry[],
  cache: ValidationCache,
  excludedUrls: ExcludedUrl[],
  pending: { count: number },
  context: { label: string; previousCount: number; log: Logger }
): Entry[] {
  if (entries.length === 0) return entries

  const localExcluded: ExcludedUrl[] = []
  const localPending = { count: 0 }
  const filtered = filterEntries(entries, cache, localExcluded, localPending)

  const massExclusion =
    filtered.length === 0 &&
    localExcluded.length === entries.length && // every entry actually failed, none merely pending
    context.previousCount >= MASS_EXCLUSION_GUARD_MIN_PREVIOUS

  if (massExclusion) {
    context.log.error(
      `[sitemap] refusing to empty sitemap-${context.label}.xml: all ${entries.length} URL(s) failed validation ` +
      `(it had ${context.previousCount} before) — this looks systemic, not per-page; keeping every URL for this run`
    )
    excludedUrls.push(...localExcluded.map(item => ({ ...item, guarded: true })))
    return entries
  }

  excludedUrls.push(...localExcluded)
  pending.count += localPending.count
  return filtered
}

// Below this many previous entries, a drop to zero is plausible on its own
// (a thin category genuinely losing its only few posts) and not worth
// guarding — the guard exists for "an entire real collection vanished".
export const MASS_EXCLUSION_GUARD_MIN_PREVIOUS = 10

async function alert(summary: ValidationSummary, log: Logger): Promise<void> {
  if (summary.excludedUrls.length === 0 && !summary.aborted) return
  const lines = summary.excludedUrls.slice(0, 50).map(item => `- ${item.url} — ${item.reason}`)
  const text = summary.aborted
    ? `Sitemap validation aborted: ${summary.aborted}`
    : `Sitemap regeneration excluded ${summary.excludedUrls.length} URL(s):\n${lines.join('\n')}${summary.excludedUrls.length > 50 ? '\n…' : ''}`
  log.error(`[sitemap] ${text}`)
  if (!VALIDATION.alertWebhookUrl) return
  try {
    await fetch(VALIDATION.alertWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, summary }),
      signal: AbortSignal.timeout(8000),
    })
  } catch (error) {
    log.warn('[sitemap] alert webhook failed:', error)
  }
}

/**
 * Brings the inventory up to date with WordPress, validates URLs within the
 * run's budget, and rewrites only the sitemap files whose content changed.
 */
export async function regenerateSitemaps(options: RegenerateOptions): Promise<RegenerationReport> {
  const log = options.log ?? silentLogger
  const startedAt = new Date()
  const previousManifest = await loadManifest()
  const reason = options.reason ?? options.mode

  try {
    const inventory = await syncInventory(await loadInventory(), options, startedAt, log)
    await saveInventory(inventory)

    const entries = buildEntries(inventory)
    let validation: ValidationSummary | null = null
    let cache: ValidationCache = {}

    if (options.validate !== false) {
      cache = await loadValidationCache()
      const targets = [...entries.pages, ...entries.categories, ...entries.videos, ...entries.authors, ...entries.articles]
      const result = await runValidation(targets, cache, { budget: options.validationBudget, log })
      cache = result.cache
      await saveValidationCache(cache)

      const excludedUrls: ExcludedUrl[] = []
      const pending = { count: 0 }
      const previousArticleCount = Object.entries(previousManifest.files)
        .filter(([name]) => name.startsWith('articles-'))
        .reduce((sum, [, file]) => sum + file.urlCount, 0)

      entries.pages = applyValidation(entries.pages, cache, excludedUrls, pending, {
        label: 'pages', previousCount: previousManifest.files.pages?.urlCount ?? 0, log,
      })
      entries.categories = applyValidation(entries.categories, cache, excludedUrls, pending, {
        label: 'categories', previousCount: previousManifest.files.categories?.urlCount ?? 0, log,
      })
      entries.videos = applyValidation(entries.videos, cache, excludedUrls, pending, {
        label: 'videos', previousCount: previousManifest.files.videos?.urlCount ?? 0, log,
      })
      entries.authors = applyValidation(entries.authors, cache, excludedUrls, pending, {
        label: 'authors', previousCount: previousManifest.files.authors?.urlCount ?? 0, log,
      })
      entries.articles = applyValidation(entries.articles, cache, excludedUrls, pending, {
        label: 'articles', previousCount: previousArticleCount, log,
      })
      const droppedCount = excludedUrls.filter(item => !item.guarded).length
      const passing = targets.length - pending.count - droppedCount
      validation = {
        checked: result.checked,
        excluded: droppedCount,
        pending: pending.count,
        cached: Math.max(0, passing - (result.aborted ? 0 : result.checked - result.failed)),
        excludedUrls,
        aborted: result.aborted,
      }
      log.info(`[sitemap] validation: ${result.checked} fetched, ${excludedUrls.length} excluded, ${pending.count} pending, ${result.due} due`)
    }

    const rendered = renderFiles(entries)
    const now = formatLastmod(new Date())!
    const files: Record<string, ManifestFile> = {}
    const changedFiles: string[] = []

    for (const file of rendered) {
      if (!file.xml.startsWith(XML_DECLARATION)) throw new Error(`${file.name}: missing XML declaration`)
      const hash = sha256(file.xml)
      const previous = previousManifest.files[file.name]
      const unchanged = previous?.hash === hash
      if (!unchanged) {
        await writeFileAtomic(sitemapFileName(file.name), file.xml)
        changedFiles.push(file.name)
      }
      files[file.name] = {
        name: file.name,
        path: publicSitemapPath(file.name),
        urlCount: file.urlCount,
        hash,
        lastmod: unchanged ? previous.lastmod : now,
        generatedAt: now,
      }
    }

    // Article chunks that no longer exist (inventory shrank) must go.
    for (const name of Object.keys(previousManifest.files)) {
      if (!files[name] && name !== 'index') await removeStoreFile(sitemapFileName(name))
    }

    const latest = computeLatestDates(inventory)
    const indexRefs: SitemapFileRef[] = [
      ...Object.values(files).map(file => ({ loc: `${SITE_URL}${file.path}`, lastmod: file.lastmod })),
      { loc: `${SITE_URL}/news-sitemap.xml`, lastmod: latest.latestArticle },
    ]
    const indexXml = renderSitemapIndex(indexRefs)
    const indexHash = sha256(indexXml)
    const previousIndex = previousManifest.files.index
    if (previousIndex?.hash !== indexHash) {
      await writeFileAtomic(sitemapFileName('index'), indexXml)
      changedFiles.push('index')
    }
    files.index = {
      name: 'index',
      path: publicSitemapPath('index'),
      urlCount: indexRefs.length,
      hash: indexHash,
      lastmod: previousIndex?.hash === indexHash ? previousIndex.lastmod : now,
      generatedAt: now,
    }

    const finishedAt = new Date()
    const run: RunInfo = {
      mode: options.mode,
      reason,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      ok: true,
    }
    const manifest: Manifest = {
      version: 1,
      generatedAt: now,
      files,
      articleFileCount: rendered.filter(file => file.name.startsWith('articles-')).length,
      validation,
      lastRun: run,
    }
    await saveManifest(manifest)
    if (validation) {
      await writeFileAtomic(REPORT_FILE, JSON.stringify({ generatedAt: now, ...validation }, null, 2))
      await alert(validation, log)
    }

    const report: RegenerationReport = {
      run,
      files: Object.values(files),
      counts: {
        pages: entries.pages.length,
        categories: entries.categories.length,
        articles: entries.articles.length,
        videos: entries.videos.length,
        authors: entries.authors.length,
      },
      validation,
      inventory: {
        articles: inventory.articles.length,
        videos: inventory.videos.length,
        categories: inventory.categories.length,
        bylines: inventory.bylines.length,
        syncedAt: inventory.syncedAt,
        fullSyncAt: inventory.fullSyncAt,
      },
      changedFiles,
    }
    log.info(`[sitemap] ${options.mode} regeneration (${reason}) finished in ${run.durationMs} ms; changed: ${changedFiles.join(', ') || 'nothing'}`)
    return report
  } catch (error) {
    const finishedAt = new Date()
    const message = error instanceof Error ? error.message : String(error)
    previousManifest.lastRun = {
      mode: options.mode,
      reason,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      ok: false,
      error: message,
    }
    await saveManifest(previousManifest).catch(() => {})
    log.error(`[sitemap] ${options.mode} regeneration (${reason}) failed: ${message}`)
    throw error
  }
}

export { articleKey, NEWS_PUBLICATION_LANGUAGE }
