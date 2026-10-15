import { applyValidation, consoleLogger, MASS_EXCLUSION_GUARD_MIN_PREVIOUS, newExclusions } from '@/lib/sitemap/generate'
import type { Entry } from '@/lib/sitemap/build'
import type { ExcludedUrl, ValidationCache, ValidationSummary } from '@/lib/sitemap/types'

const silent = { info: () => {}, warn: () => {}, error: () => {} }

function entries(n: number, kind: Entry['kind'] = 'video'): Entry[] {
  return Array.from({ length: n }, (_, i) => ({
    loc: `https://en.igihe.com/videos/v${i}`,
    url: `https://en.igihe.com/videos/v${i}`,
    kind,
    key: `k${i}`,
  }))
}

function failCache(list: Entry[], reason = 'canonical points to elsewhere'): ValidationCache {
  const cache: ValidationCache = {}
  for (const item of list) {
    cache[item.url] = { url: item.url, kind: item.kind, ok: false, reason, checkedAt: new Date().toISOString(), key: item.key }
  }
  return cache
}

function okCache(list: Entry[]): ValidationCache {
  const cache: ValidationCache = {}
  for (const item of list) {
    cache[item.url] = { url: item.url, kind: item.kind, ok: true, checkedAt: new Date().toISOString(), key: item.key }
  }
  return cache
}

describe('applyValidation mass-exclusion guard', () => {
  it('keeps every URL when a previously non-trivial collection fails all at once', () => {
    const list = entries(87)
    const cache = failCache(list)
    const excludedUrls: ExcludedUrl[] = []
    const pending = { count: 0 }

    const result = applyValidation(list, cache, excludedUrls, pending, { label: 'videos', previousCount: 87, log: silent })

    expect(result).toEqual(list) // nothing dropped
    expect(excludedUrls).toHaveLength(87)
    expect(excludedUrls.every(item => item.guarded === true)).toBe(true)
    expect(pending.count).toBe(0)
  })

  it('drops as normal when only some of the collection fails', () => {
    const list = entries(20)
    const cache = { ...failCache(list.slice(0, 5)), ...okCache(list.slice(5)) }
    const excludedUrls: ExcludedUrl[] = []
    const pending = { count: 0 }

    const result = applyValidation(list, cache, excludedUrls, pending, { label: 'videos', previousCount: 20, log: silent })

    expect(result).toHaveLength(15)
    expect(excludedUrls).toHaveLength(5)
    expect(excludedUrls.every(item => !item.guarded)).toBe(true)
  })

  it('drops as normal when the collection was already small (below the guard threshold)', () => {
    const list = entries(MASS_EXCLUSION_GUARD_MIN_PREVIOUS - 1)
    const cache = failCache(list)
    const excludedUrls: ExcludedUrl[] = []
    const pending = { count: 0 }

    const result = applyValidation(list, cache, excludedUrls, pending, {
      label: 'authors', previousCount: MASS_EXCLUSION_GUARD_MIN_PREVIOUS - 1, log: silent,
    })

    expect(result).toHaveLength(0)
    expect(excludedUrls).toHaveLength(list.length)
    expect(excludedUrls.every(item => !item.guarded)).toBe(true)
  })

  it('does not fire when the emptiness is only pending URLs, not real failures', () => {
    const list = entries(50) // all uncached -> pending, not excluded
    const excludedUrls: ExcludedUrl[] = []
    const pending = { count: 0 }

    const result = applyValidation(list, {}, excludedUrls, pending, { label: 'videos', previousCount: 50, log: silent })

    expect(excludedUrls).toHaveLength(0) // nothing "failed" — just unchecked
    expect(pending.count).toBe(50)
    expect(result).toHaveLength(50) // included unvalidated (default policy)
  })

  it('exposes a working default logger', () => {
    expect(() => consoleLogger.info('noop')).not.toThrow()
  })
})

describe('newExclusions', () => {
  const summary = (...urls: string[]): ValidationSummary => ({
    checked: 0, excluded: urls.length, pending: 0, cached: 0,
    excludedUrls: urls.map(url => ({ url, kind: 'article' as const, reason: 'noindex (meta robots)' })),
  })

  it('reports only URLs that were not already excluded last run', () => {
    expect(newExclusions(summary('a', 'b'), summary('a', 'b', 'c')).map(i => i.url)).toEqual(['c'])
  })

  it('reports nothing when the same URLs stay excluded (no repeat alerts every run)', () => {
    expect(newExclusions(summary('a', 'b'), summary('b', 'a'))).toEqual([])
  })

  it('reports everything on the first run', () => {
    expect(newExclusions(null, summary('a', 'b'))).toHaveLength(2)
  })
})
