import { SITE_URL } from '@/lib/sitemap/config'
import { checkUrl, classify, planValidation, runValidation } from '@/lib/sitemap/validate'
import type { ValidationCache, ValidationTarget } from '@/lib/sitemap/types'

function html(head: string): string {
  return `<!DOCTYPE html><html><head>${head}</head><body>there's no page here</body></html>`
}

function respond(status: number, body = '', headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', ...headers } })
}

const ARTICLE = 'https://en.igihe.com/news/article/a-story'

describe('checkUrl', () => {
  it('accepts a 200 HTML page with a self canonical', async () => {
    const fetchImpl = async () => respond(200, html(`<link rel="canonical" href="${ARTICLE}"/>`))
    await expect(checkUrl(ARTICLE, 'article', fetchImpl)).resolves.toEqual({ ok: true, status: 200 })
  })

  it('accepts a listing page without a canonical', async () => {
    const fetchImpl = async () => respond(200, html('<title>IGIHE</title>'))
    await expect(checkUrl('https://en.igihe.com/news', 'category', fetchImpl)).resolves.toEqual({ ok: true, status: 200 })
  })

  it('rejects redirects without following them', async () => {
    const fetchImpl = async () => respond(301, '', { location: 'https://en.igihe.com/elsewhere' })
    await expect(checkUrl(ARTICLE, 'article', fetchImpl)).resolves.toMatchObject({ ok: false, reason: 'redirects (301) to https://en.igihe.com/elsewhere' })
  })

  it('rejects non-200 responses and marks 5xx as transient', async () => {
    await expect(checkUrl(ARTICLE, 'article', async () => respond(404))).resolves.toMatchObject({ ok: false, reason: 'HTTP 404', transient: false })
    await expect(checkUrl(ARTICLE, 'article', async () => respond(503))).resolves.toMatchObject({ ok: false, reason: 'HTTP 503', transient: true })
  })

  it('rejects noindex from the header or the meta tag', async () => {
    await expect(checkUrl(ARTICLE, 'article', async () => respond(200, html(''), { 'x-robots-tag': 'noindex, nofollow' })))
      .resolves.toMatchObject({ ok: false, reason: 'noindex (X-Robots-Tag header)' })
    await expect(checkUrl(ARTICLE, 'article', async () => respond(200, html('<meta name="robots" content="noindex"/>'))))
      .resolves.toMatchObject({ ok: false, reason: 'noindex (meta robots)' })
  })

  it('rejects a canonical that points elsewhere', async () => {
    const fetchImpl = async () => respond(200, html('<link href="https://new.igihe.com/english/x/" rel="canonical">'))
    await expect(checkUrl(ARTICLE, 'article', fetchImpl)).resolves.toMatchObject({ ok: false, reason: 'canonical points to https://new.igihe.com/english/x/' })
  })

  it('treats a missing canonical on an article as a soft 404', async () => {
    const fetchImpl = async () => respond(200, html('<title>Some Slug | IGIHE</title>'))
    await expect(checkUrl(ARTICLE, 'article', fetchImpl)).resolves.toMatchObject({ ok: false, reason: 'no self-canonical (content not found)' })
  })

  it('tolerates a trailing slash difference in the canonical', async () => {
    const fetchImpl = async () => respond(200, html(`<link rel="canonical" href="${ARTICLE}/">`))
    await expect(checkUrl(ARTICLE, 'article', fetchImpl)).resolves.toEqual({ ok: true, status: 200 })
  })

  it('refuses URLs blocked by robots.txt without fetching', async () => {
    const fetchImpl = jest.fn()
    await expect(checkUrl('https://en.igihe.com/news?page=2', 'category', fetchImpl)).resolves.toEqual({ ok: false, reason: 'blocked by robots.txt' })
    await expect(checkUrl('https://en.igihe.com/api/proxy/x', 'page', fetchImpl)).resolves.toEqual({ ok: false, reason: 'blocked by robots.txt' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('reports network failures as transient', async () => {
    const fetchImpl = async () => { throw new Error('ECONNRESET') }
    await expect(checkUrl(ARTICLE, 'article', fetchImpl)).resolves.toMatchObject({ ok: false, transient: true })
  })
})

describe('planning and classification', () => {
  const now = Date.parse('2026-09-15T08:00:00Z')
  const targets: ValidationTarget[] = [
    { url: 'https://en.igihe.com/news/article/old', kind: 'article', key: '2020-01-01T00:00:00Z' },
    { url: 'https://en.igihe.com/news/article/new', kind: 'article', key: '2026-09-15T07:00:00Z' },
    { url: 'https://en.igihe.com/news', kind: 'category', key: '' },
    { url: 'https://en.igihe.com', kind: 'page', key: '' },
  ]

  it('checks small collections first, then the newest unchecked articles, within the budget', () => {
    const { toCheck, due } = planValidation(targets, {}, now, 3)
    expect(due).toBe(4)
    expect(toCheck.map(t => t.url)).toEqual(['https://en.igihe.com', 'https://en.igihe.com/news', 'https://en.igihe.com/news/article/new'])
  })

  it('skips fresh passing verdicts and re-checks changed content', () => {
    const cache: ValidationCache = {
      'https://en.igihe.com/news/article/old': { url: 'https://en.igihe.com/news/article/old', kind: 'article', ok: true, checkedAt: '2026-09-14T08:00:00Z', key: '2020-01-01T00:00:00Z' },
      'https://en.igihe.com/news/article/new': { url: 'https://en.igihe.com/news/article/new', kind: 'article', ok: true, checkedAt: '2026-09-14T08:00:00Z', key: '2026-09-01T00:00:00Z' },
    }
    const { toCheck } = planValidation(targets, cache, now, 10)
    expect(toCheck.map(t => t.url)).toEqual(['https://en.igihe.com', 'https://en.igihe.com/news', 'https://en.igihe.com/news/article/new'])
    expect(classify(targets[0], cache)).toBe('ok')
    expect(classify(targets[1], cache)).toBe('pending')
  })

  it('records verdicts, keeps good verdicts through transient failures, and forgets removed URLs', async () => {
    const cache: ValidationCache = {
      'https://en.igihe.com/gone': { url: 'https://en.igihe.com/gone', kind: 'page', ok: true, checkedAt: '2026-09-14T08:00:00Z', key: '' },
      'https://en.igihe.com/news': { url: 'https://en.igihe.com/news', kind: 'category', ok: true, checkedAt: '2026-01-01T00:00:00Z', key: '' },
    }
    const fetchImpl = async (url: string) => {
      if (url === 'https://en.igihe.com/news') throw new Error('timeout')
      if (url.endsWith('/old')) return respond(200, html('<meta name="robots" content="noindex">'))
      return respond(200, html(`<link rel="canonical" href="${url}">`))
    }
    const result = await runValidation(targets, cache, { budget: 10, concurrency: 2, now, fetchImpl })
    expect(result.checked).toBe(4)
    expect(result.cache['https://en.igihe.com/gone']).toBeUndefined()
    expect(result.cache['https://en.igihe.com/news'].ok).toBe(true)
    expect(result.cache['https://en.igihe.com/news/article/old']).toMatchObject({ ok: false, reason: 'noindex (meta robots)' })
    expect(classify(targets[0], result.cache)).toBe('excluded')
    expect(classify(targets[1], result.cache)).toBe('ok')
  })

  it('discards the run when an abnormal share of checks fail at the transport level', async () => {
    const many: ValidationTarget[] = Array.from({ length: 30 }, (_, i) => ({ url: `https://en.igihe.com/news/article/p${i}`, kind: 'article', key: 'k' }))
    const fetchImpl = async () => respond(403)
    const result = await runValidation(many, {}, { budget: 30, concurrency: 5, now, fetchImpl })
    expect(result.aborted).toBeDefined()
    expect(Object.keys(result.cache)).toHaveLength(0)
    expect(result.outcomes).toHaveLength(30)
  })

  const SITE = SITE_URL
  const homeOk = () => respond(200, html('<title>IGIHE</title>'))
  const noindex = () => respond(200, html('<meta name="robots" content="noindex">'))
  const selfCanonical = (url: string) => respond(200, html(`<link rel="canonical" href="${url}">`))
  const articles = (n: number): ValidationTarget[] =>
    Array.from({ length: n }, (_, i) => ({ url: `https://en.igihe.com/news/article/p${i}`, kind: 'article', key: 'k' }))

  it('keeps content verdicts even when most of a batch legitimately fails', async () => {
    // 20 of 30 pages carry noindex: a real finding, not an outage.
    const many = articles(30)
    const fetchImpl = async (url: string) =>
      url === SITE ? homeOk() : Number(url.split('/p').pop()) < 20 ? noindex() : selfCanonical(url)
    const result = await runValidation(many, {}, { budget: 30, concurrency: 5, now, fetchImpl })
    expect(result.aborted).toBeUndefined()
    expect(Object.values(result.cache).filter(v => !v.ok)).toHaveLength(20)
  })

  it('records a retry batch of URLs that are already known to be bad (the production case)', async () => {
    // Failed verdicts expire after the retry window and come due again. That
    // batch fails ~100% by construction and must not be mistaken for an outage.
    const bad = articles(20)
    const stale = new Date(now - 7 * 60 * 60 * 1000).toISOString()
    const cache: ValidationCache = Object.fromEntries(
      bad.map(t => [t.url, { url: t.url, kind: t.kind, ok: false, reason: 'noindex (meta robots)', checkedAt: stale, key: t.key }])
    )
    const fetchImpl = async (url: string) => (url === SITE ? homeOk() : noindex())

    const result = await runValidation(bad, cache, { budget: 50, concurrency: 4, now, fetchImpl })

    expect(result.checked).toBe(20)
    expect(result.failed).toBe(20)
    expect(result.aborted).toBeUndefined()
    // The verdicts were refreshed, so the URLs are not due again on the next run.
    expect(Object.values(result.cache).every(v => v.checkedAt === new Date(now).toISOString())).toBe(true)
    expect(planValidation(bad, result.cache, now + 60_000, 50).toCheck).toHaveLength(0)
  })

  it('aborts when the home page fails too, whatever the reason', async () => {
    const many = articles(30)
    const result = await runValidation(many, {}, { budget: 30, concurrency: 5, now, fetchImpl: async () => noindex() })
    expect(result.aborted).toMatch(/control check failed/)
    expect(result.aborted).toMatch(/home page/)
    expect(Object.keys(result.cache)).toHaveLength(0)
  })

  it('aborts when articles that passed before stop passing (site-wide article breakage)', async () => {
    const known: ValidationCache = {
      'https://en.igihe.com/news/article/was-fine': {
        url: 'https://en.igihe.com/news/article/was-fine', kind: 'article', ok: true, checkedAt: new Date(now - 3600_000).toISOString(), key: 'k',
      },
    }
    const batch = articles(10)
    const fetchImpl = async (url: string) => (url === SITE ? homeOk() : noindex())
    const result = await runValidation(batch, known, { budget: 10, concurrency: 2, now, fetchImpl })
    expect(result.aborted).toMatch(/previously passing articles/)
    expect(result.cache).toBe(known)
  })

  it('trusts the batch when at least one previously good article still passes', async () => {
    const good = (n: number) => `https://en.igihe.com/news/article/ok${n}`
    const known: ValidationCache = Object.fromEntries([1, 2, 3].map(n => [good(n), {
      url: good(n), kind: 'article', ok: true, checkedAt: new Date(now - n * 3600_000).toISOString(), key: 'k',
    }]))
    const batch = articles(10)
    const fetchImpl = async (url: string) => (url === SITE || url === good(1) ? (url === SITE ? homeOk() : selfCanonical(url)) : noindex())
    const result = await runValidation(batch, known, { budget: 10, concurrency: 2, now, fetchImpl })
    expect(result.aborted).toBeUndefined()
    expect(Object.values(result.cache).filter(v => !v.ok)).toHaveLength(10)
  })

  it('does not bother with controls for a couple of ordinary failures', async () => {
    const batch = articles(2)
    const fetchImpl = jest.fn(async (url: string) => (url === SITE ? homeOk() : noindex()))
    const result = await runValidation(batch, {}, { budget: 2, concurrency: 1, now, fetchImpl })
    expect(result.aborted).toBeUndefined()
    expect(fetchImpl).toHaveBeenCalledTimes(2) // just the two URLs, no home-page control
  })
})
