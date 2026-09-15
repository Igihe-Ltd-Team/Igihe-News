import { VALIDATION } from './config.ts'
import { isBlockedByRobots } from './robotsRules.ts'
import type { Logger, UrlKind, ValidationCache, ValidationResult, ValidationTarget } from './types.ts'

export interface CheckOutcome {
  ok: boolean
  status?: number
  reason?: string
  /** Network/5xx failures — likely the checker or an outage, not the URL. */
  transient?: boolean
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

// Next.js streams metadata for non-bot user agents: <link rel="canonical">
// and <meta name="robots"> can land in the body, not the <head>, so the
// whole document (capped) has to be read before judging a page.
const DOCUMENT_READ_LIMIT = 2 * 1024 * 1024

function normalizeForCompare(url: string): string {
  const parsed = new URL(url)
  const pathname = parsed.pathname.replace(/\/+$/, '') || '/'
  return `${parsed.protocol}//${parsed.host.toLowerCase()}${pathname}`
}

function extractCanonical(html: string): string | null {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? []
  for (const tag of linkTags) {
    if (!/\brel\s*=\s*["']?\s*canonical\b/i.test(tag)) continue
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)
    if (href) return href[1]
  }
  return null
}

function hasNoindexMeta(html: string): boolean {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? []
  return metaTags.some(tag => {
    if (!/\bname\s*=\s*["'](robots|googlebot)["']/i.test(tag)) return false
    const content = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i)
    return Boolean(content && /\bnoindex\b/i.test(content[1]))
  })
}

async function readDocument(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return await response.text()
  const decoder = new TextDecoder()
  let html = ''
  try {
    while (html.length < DOCUMENT_READ_LIMIT) {
      const { value, done } = await reader.read()
      if (done) break
      html += decoder.decode(value, { stream: true })
    }
  } finally {
    reader.cancel().catch(() => {})
  }
  return html
}

/**
 * Fetches one URL the way a crawler would and decides whether it belongs in
 * a sitemap: it must answer 200 with HTML, not be noindexed (header or meta),
 * not declare a canonical elsewhere, and — for article and video pages, whose
 * "not found" state is rendered with a 200 — carry a canonical to itself.
 */
export async function checkUrl(url: string, kind: UrlKind, fetchImpl: FetchLike = fetch): Promise<CheckOutcome> {
  if (isBlockedByRobots(url)) return { ok: false, reason: 'blocked by robots.txt' }

  let response: Response
  try {
    response = await fetchImpl(url, {
      redirect: 'manual',
      headers: { 'User-Agent': VALIDATION.userAgent, Accept: 'text/html' },
      signal: AbortSignal.timeout(VALIDATION.timeoutMs),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ok: false, reason: `fetch failed: ${message}`, transient: true }
  }

  const status = response.status
  if (status >= 300 && status < 400) {
    await response.body?.cancel().catch(() => {})
    return { ok: false, status, reason: `redirects (${status}) to ${response.headers.get('location') ?? 'unknown'}` }
  }
  if (status !== 200) {
    await response.body?.cancel().catch(() => {})
    // 403/429 are what a WAF or rate limiter answers a misbehaving checker
    // with — treat them as transport failures rather than page verdicts.
    return { ok: false, status, reason: `HTTP ${status}`, transient: status >= 500 || status === 429 || status === 403 }
  }

  const robotsHeader = response.headers.get('x-robots-tag') ?? ''
  if (/\bnoindex\b/i.test(robotsHeader)) {
    await response.body?.cancel().catch(() => {})
    return { ok: false, status, reason: 'noindex (X-Robots-Tag header)' }
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType && !/text\/html/i.test(contentType)) {
    await response.body?.cancel().catch(() => {})
    return { ok: false, status, reason: `unexpected content-type ${contentType}` }
  }

  const html = await readDocument(response)

  if (hasNoindexMeta(html)) return { ok: false, status, reason: 'noindex (meta robots)' }

  const canonical = extractCanonical(html)
  if (canonical) {
    let resolved: string
    try {
      resolved = new URL(canonical, url).toString()
    } catch {
      return { ok: false, status, reason: `unparseable canonical ${canonical}` }
    }
    if (normalizeForCompare(resolved) !== normalizeForCompare(url)) {
      return { ok: false, status, reason: `canonical points to ${resolved}` }
    }
  } else if (kind === 'article' || kind === 'video') {
    // The article/video routes only emit a canonical once they have found the
    // content; a missing one means the page rendered its not-found state.
    return { ok: false, status, reason: 'no self-canonical (content not found)' }
  }

  return { ok: true, status }
}

function ttlFor(kind: UrlKind): number {
  if (kind === 'article') return VALIDATION.ttlMs.article
  if (kind === 'video') return VALIDATION.ttlMs.video
  return VALIDATION.ttlMs.other
}

const KIND_ORDER: Record<UrlKind, number> = { page: 0, category: 1, video: 2, author: 3, article: 4 }

export function needsCheck(target: ValidationTarget, cached: ValidationResult | undefined, now: number): boolean {
  if (!cached) return true
  if (cached.key !== target.key) return true
  const age = now - Date.parse(cached.checkedAt)
  return cached.ok ? age > ttlFor(target.kind) : age > VALIDATION.retryFailedAfterMs
}

/**
 * Picks which targets to fetch this run: small collections first (pages,
 * categories, videos, authors), then never-checked or changed articles newest
 * first, then articles whose last check has expired.
 */
export function planValidation(
  targets: ValidationTarget[],
  cache: ValidationCache,
  now: number,
  budget: number
): { toCheck: ValidationTarget[]; due: number } {
  const due = targets.filter(target => needsCheck(target, cache[target.url], now))
  due.sort((a, b) => {
    const kind = KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
    if (kind !== 0) return kind
    const aFresh = !cache[a.url] || cache[a.url].key !== a.key
    const bFresh = !cache[b.url] || cache[b.url].key !== b.key
    if (aFresh !== bFresh) return aFresh ? -1 : 1
    if (aFresh) return b.key.localeCompare(a.key) // newest content first
    return Date.parse(cache[a.url].checkedAt) - Date.parse(cache[b.url].checkedAt)
  })
  return { toCheck: due.slice(0, Math.max(0, budget)), due: due.length }
}

export type UrlState = 'ok' | 'excluded' | 'pending'

export function classify(target: ValidationTarget, cache: ValidationCache): UrlState {
  const cached = cache[target.url]
  if (!cached || cached.key !== target.key) return 'pending'
  return cached.ok ? 'ok' : 'excluded'
}

export interface RunValidationOptions {
  budget?: number
  concurrency?: number
  now?: number
  fetchImpl?: FetchLike
  log?: Logger
}

export interface CheckedUrl {
  url: string
  kind: UrlKind
  outcome: CheckOutcome
}

export interface RunValidationResult {
  cache: ValidationCache
  checked: number
  failed: number
  due: number
  /** Every fetch made this run, including ones discarded by an abort. */
  outcomes: CheckedUrl[]
  aborted?: string
}

/** Groups failed checks by reason (status-specific details collapsed) for logs and alerts. */
export function summarizeFailures(outcomes: CheckedUrl[]): Array<{ reason: string; count: number; sample: string }> {
  const groups = new Map<string, { count: number; sample: string }>()
  for (const item of outcomes) {
    if (item.outcome.ok) continue
    const reason = (item.outcome.reason ?? 'failed').replace(/ to https?:\/\/\S+$/, ' to <url>')
    const group = groups.get(reason) ?? { count: 0, sample: item.url }
    group.count++
    groups.set(reason, group)
  }
  return [...groups.entries()].map(([reason, group]) => ({ reason, ...group })).sort((a, b) => b.count - a.count)
}

/**
 * Runs the planned checks and folds the outcomes into the cache. If an
 * abnormal share of checks fail, the failures are discarded (the cache keeps
 * its previous verdicts) so a WAF rule or an outage can't empty the sitemap.
 */
export async function runValidation(
  targets: ValidationTarget[],
  cache: ValidationCache,
  options: RunValidationOptions = {}
): Promise<RunValidationResult> {
  const now = options.now ?? Date.now()
  const budget = options.budget ?? VALIDATION.budgetPerRun
  const { toCheck, due } = planValidation(targets, cache, now, budget)
  const outcomes = new Map<string, { target: ValidationTarget; outcome: CheckOutcome }>()

  let cursor = 0
  const worker = async () => {
    while (cursor < toCheck.length) {
      const target = toCheck[cursor++]
      const outcome = await checkUrl(target.url, target.kind, options.fetchImpl)
      outcomes.set(target.url, { target, outcome })
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, options.concurrency ?? VALIDATION.concurrency) }, worker))

  const checkedUrls: CheckedUrl[] = [...outcomes.values()].map(entry => ({ url: entry.target.url, kind: entry.target.kind, outcome: entry.outcome }))
  const failed = checkedUrls.filter(entry => !entry.outcome.ok).length
  const transient = checkedUrls.filter(entry => !entry.outcome.ok && entry.outcome.transient).length
  const checked = outcomes.size
  const outage =
    checked >= VALIDATION.minChecksForRatio &&
    (transient / checked > VALIDATION.maxTransientFailureRatio || failed / checked > VALIDATION.maxTotalFailureRatio)
  if (outage) {
    const message = `${failed}/${checked} checks failed (${transient} transport failures) — treating the run as a validator/site outage and keeping previous verdicts`
    options.log?.error(`[sitemap] validation aborted: ${message}`)
    for (const group of summarizeFailures(checkedUrls).slice(0, 8)) {
      options.log?.error(`[sitemap]   ${group.count} × ${group.reason} (e.g. ${group.sample})`)
    }
    return { cache, checked, failed, due, outcomes: checkedUrls, aborted: message }
  }

  const next: ValidationCache = { ...cache }
  const checkedAt = new Date(now).toISOString()
  for (const { target, outcome } of outcomes.values()) {
    // A transient failure on a previously-good URL keeps the good verdict
    // until it fails again after the retry window.
    const previous = cache[target.url]
    if (!outcome.ok && outcome.transient && previous?.ok && previous.key === target.key) {
      next[target.url] = { ...previous, checkedAt }
      continue
    }
    next[target.url] = {
      url: target.url,
      kind: target.kind,
      ok: outcome.ok,
      status: outcome.status,
      reason: outcome.reason,
      checkedAt,
      key: target.key,
    }
  }

  // Drop verdicts for URLs that no longer exist in the inventory.
  const live = new Set(targets.map(target => target.url))
  for (const url of Object.keys(next)) if (!live.has(url)) delete next[url]

  return { cache: next, checked, failed, due, outcomes: checkedUrls }
}
