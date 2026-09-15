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

  it('keeps content verdicts even when most of a batch legitimately fails', async () => {
    // 20 of 30 pages carry noindex: a real finding, not an outage.
    const many: ValidationTarget[] = Array.from({ length: 30 }, (_, i) => ({ url: `https://en.igihe.com/news/article/p${i}`, kind: 'article', key: 'k' }))
    const fetchImpl = async (url: string) =>
      Number(url.slice(-2).replace(/\D/g, '')) < 20
        ? respond(200, html('<meta name="robots" content="noindex">'))
        : respond(200, html(`<link rel="canonical" href="${url}">`))
    const result = await runValidation(many, {}, { budget: 30, concurrency: 5, now, fetchImpl })
    expect(result.aborted).toBeUndefined()
    expect(Object.values(result.cache).filter(v => !v.ok)).toHaveLength(20)
  })

  it('still aborts when practically everything fails, whatever the reason', async () => {
    const many: ValidationTarget[] = Array.from({ length: 30 }, (_, i) => ({ url: `https://en.igihe.com/news/article/p${i}`, kind: 'article', key: 'k' }))
    const fetchImpl = async () => respond(200, html('<meta name="robots" content="noindex">'))
    const result = await runValidation(many, {}, { budget: 30, concurrency: 5, now, fetchImpl })
    expect(result.aborted).toBeDefined()
  })
})
