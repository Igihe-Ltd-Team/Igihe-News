import { fileCache } from '@/lib/cache/fileCache'
import {
  LRUCache,
  CACHE_CONFIG,
  memoryCache,
  pendingRequests,
  checkRateLimit,
  cachedRequest,
  cacheArticleInMemory,
  cacheArticlesFromList,
  clearCache,
  cleanExpiredCache,
  getCacheStats,
  getCachedArticle,
} from '../../src/services/cacheManager'

// ── LRUCache ──────────────────────────────────────────────────────────────────

describe('LRUCache', () => {
  let cache: LRUCache<string>

  beforeEach(() => {
    cache = new LRUCache<string>(3)
  })

  it('stores and retrieves values', () => {
    cache.set('a', { data: 'alpha', timestamp: 1 })
    expect(cache.get('a')).toEqual({ data: 'alpha', timestamp: 1 })
  })

  it('returns undefined for missing keys', () => {
    expect(cache.get('missing')).toBeUndefined()
  })

  it('evicts the LRU entry when at capacity', () => {
    cache.set('a', { data: 'alpha', timestamp: 1 })
    cache.set('b', { data: 'beta', timestamp: 2 })
    cache.set('c', { data: 'gamma', timestamp: 3 })
    cache.get('a') // promote 'a'
    cache.set('d', { data: 'delta', timestamp: 4 }) // should evict 'b'

    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('a')).toBeDefined()
    expect(cache.get('c')).toBeDefined()
    expect(cache.get('d')).toBeDefined()
  })

  it('promotes accessed entry (LRU ordering)', () => {
    cache.set('a', { data: 'alpha', timestamp: 1 })
    cache.set('b', { data: 'beta', timestamp: 2 })
    cache.set('c', { data: 'gamma', timestamp: 3 })

    cache.get('a') // promote 'a'
    cache.set('d', { data: 'delta', timestamp: 4 }) // evicts 'b' (now LRU)

    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('a')).toBeDefined()
  })

  it('returns correct size', () => {
    expect(cache.size()).toBe(0)
    cache.set('a', { data: 'x', timestamp: 1 })
    cache.set('b', { data: 'y', timestamp: 2 })
    expect(cache.size()).toBe(2)
  })

  it('deletes a key', () => {
    cache.set('a', { data: 'x', timestamp: 1 })
    expect(cache.delete('a')).toBe(true)
    expect(cache.get('a')).toBeUndefined()
  })

  it('returns false when deleting missing key', () => {
    expect(cache.delete('ghost')).toBe(false)
  })

  it('clears all entries', () => {
    cache.set('a', { data: 'x', timestamp: 1 })
    cache.set('b', { data: 'y', timestamp: 2 })
    cache.clear()
    expect(cache.size()).toBe(0)
  })

  it('lists all keys', () => {
    cache.set('a', { data: 'x', timestamp: 1 })
    cache.set('b', { data: 'y', timestamp: 2 })
    expect(cache.keys()).toEqual(expect.arrayContaining(['a', 'b']))
    expect(cache.keys()).toHaveLength(2)
  })

  it('has() returns correct boolean', () => {
    cache.set('a', { data: 'x', timestamp: 1 })
    expect(cache.has('a')).toBe(true)
    expect(cache.has('z')).toBe(false)
  })

  it('overwrites existing key without growing', () => {
    cache.set('a', { data: 'v1', timestamp: 1 })
    cache.set('a', { data: 'v2', timestamp: 2 })
    expect(cache.size()).toBe(1)
    expect(cache.get('a')?.data).toBe('v2')
  })
})

// ── CACHE_CONFIG ──────────────────────────────────────────────────────────────

describe('CACHE_CONFIG', () => {
  it('has expected defaults', () => {
    expect(CACHE_CONFIG.defaultTTL).toBe(5 * 60 * 1000)
    expect(CACHE_CONFIG.maxMemoryCacheSize).toBe(100)
    expect(CACHE_CONFIG.rateLimitMax).toBe(100)
    expect(CACHE_CONFIG.rateLimitWindowMs).toBe(60_000)
  })
})

// ── checkRateLimit ────────────────────────────────────────────────────────────

describe('checkRateLimit', () => {
  it('does not throw under the limit', () => {
    expect(() => checkRateLimit('test-limit-ok', 5, 60_000)).not.toThrow()
  })

  it('throws when limit is exceeded', () => {
    const key = `test-limit-${Date.now()}`
    // Fill up to limit
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60_000)
    expect(() => checkRateLimit(key, 3, 60_000)).toThrow('Rate limit exceeded')
  })

  it('allows requests after window expires', () => {
    jest.useFakeTimers()
    const key = `test-window-${Date.now()}`

    for (let i = 0; i < 2; i++) checkRateLimit(key, 2, 1000)
    expect(() => checkRateLimit(key, 2, 1000)).toThrow('Rate limit exceeded')

    jest.advanceTimersByTime(1001)
    expect(() => checkRateLimit(key, 2, 1000)).not.toThrow()
    jest.useRealTimers()
  })
})

// ── cachedRequest ─────────────────────────────────────────────────────────────

describe('cachedRequest', () => {
  const mockData = { id: 1, slug: 'cached-post', title: { rendered: 'Post' }, date: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() }

  beforeEach(() => {
    memoryCache.clear()
    pendingRequests.clear()
    ;(fileCache.get as jest.Mock).mockResolvedValue(null)
    ;(fileCache.set as jest.Mock).mockResolvedValue(undefined)
  })

  it('calls fetchFn and returns data on cache miss', async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockData)
    const result = await cachedRequest({ key: 'test:miss', fetchFn })
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(result).toEqual(mockData)
  })

  it('returns cached data without calling fetchFn on cache hit', async () => {
    const fetchFn = jest.fn().mockResolvedValue(mockData)

    await cachedRequest({ key: 'test:hit', fetchFn })
    const result = await cachedRequest({ key: 'test:hit', fetchFn })

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(result).toEqual(mockData)
  })

  it('deduplicates concurrent in-flight requests', async () => {
    const fetchFn = jest.fn().mockImplementation(
      () => new Promise(res => setTimeout(() => res(mockData), 50))
    )

    const [r1, r2, r3] = await Promise.all([
      cachedRequest({ key: 'test:dedup', fetchFn }),
      cachedRequest({ key: 'test:dedup', fetchFn }),
      cachedRequest({ key: 'test:dedup', fetchFn }),
    ])

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('uses dynamic TTL when getContentDate is provided', async () => {
    const recentDate = new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30min ago
    const data = { ...mockData, date: recentDate }
    const fetchFn = jest.fn().mockResolvedValue(data)

    const result = await cachedRequest({
      key: 'test:dynamic-ttl',
      fetchFn,
      getContentDate: (d: any) => d.date,
    })

    expect(result).toEqual(data)
    expect(fileCache.set).toHaveBeenCalled()
  })

  it('returns stale data from file cache if memory cache misses', async () => {
    const fileData = { ...mockData, slug: 'from-file' }
    ;(fileCache.get as jest.Mock).mockResolvedValue(fileData)

    const fetchFn = jest.fn()
    const result = await cachedRequest({ key: 'test:file-hit', fetchFn })

    expect(result).toEqual(fileData)
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('falls back to stale memory cache on fetch error', async () => {
    const staleData = { ...mockData, slug: 'stale' }
    memoryCache.set('test:stale-fallback', { data: staleData, timestamp: 0 }) // very old

    const fetchFn = jest.fn().mockRejectedValue(new Error('Network Error'))

    const result = await cachedRequest({
      key: 'test:stale-fallback',
      fetchFn,
      ttl: 1, // 1ms — will be expired
    })

    expect(result).toEqual(staleData)
  })

  it('re-throws when no stale data is available', async () => {
    ;(fileCache.get as jest.Mock).mockResolvedValue(null)
    const fetchFn = jest.fn().mockRejectedValue(new Error('Hard failure'))

    await expect(
      cachedRequest({ key: 'test:hard-fail', fetchFn })
    ).rejects.toThrow('Hard failure')
  })

  it('respects dedup: false option', async () => {
  const fetchFn = jest.fn().mockResolvedValue(mockData)

  await cachedRequest({ key: 'test:no-dedup', fetchFn })
  
  // Clear cache to force a new fetch
  memoryCache.delete('test:no-dedup')
  pendingRequests.delete('test:no-dedup')

  await cachedRequest({ key: 'test:no-dedup', fetchFn, dedup: false })
  expect(fetchFn).toHaveBeenCalledTimes(2)
})

  it('triggers stale-while-revalidate for dynamic TTL', async () => {
    jest.useFakeTimers()

    const now = Date.now()
    const oldDate = new Date(now - 2 * 60 * 60 * 1000).toISOString() // 2h old → 5min TTL

    const staleData = { ...mockData, date: oldDate }
    const freshData = { ...mockData, date: new Date().toISOString(), id: 999 }

    // Plant stale entry (6 min old — past fresh but within 10×)
    memoryCache.set('test:swr', { data: staleData, timestamp: now - 6 * 60 * 1000 })

    const fetchFn = jest.fn().mockResolvedValue(freshData)

    const result = await cachedRequest({
      key: 'test:swr',
      fetchFn,
      getContentDate: (d: any) => d.date,
    })

    // Should return stale immediately
    expect(result).toEqual(staleData)
    // Background fetch should have been triggered
    await Promise.resolve() // flush micro-tasks
    jest.useRealTimers()
  })
})

// ── cacheArticleInMemory ──────────────────────────────────────────────────────

describe('cacheArticleInMemory', () => {
  beforeEach(() => memoryCache.clear())

  it('stores article by slug key', () => {
    const article = { id: 1, slug: 'my-article', title: { rendered: 'T' }, date: new Date().toISOString() } as any
    cacheArticleInMemory(article)
    expect(memoryCache.get('post:my-article')).toBeDefined()
    expect(memoryCache.get('post:my-article')?.data).toEqual(article)
  })

  it('does nothing for articles without slug', () => {
    cacheArticleInMemory({ id: 1, title: { rendered: 'T' } } as any)
    expect(memoryCache.size()).toBe(0)
  })

  it('skips if a pending request exists for the key', () => {
    pendingRequests.set('post:busy', Promise.resolve(null))
    const article = { id: 1, slug: 'busy', date: new Date().toISOString() } as any
    cacheArticleInMemory(article)
    expect(memoryCache.get('post:busy')).toBeUndefined()
    pendingRequests.delete('post:busy')
  })
})

// ── cacheArticlesFromList ─────────────────────────────────────────────────────

describe('cacheArticlesFromList', () => {
  beforeEach(() => {
    memoryCache.clear()
    ;(fileCache.set as jest.Mock).mockResolvedValue(undefined)
  })

  it('caches all articles from a list', async () => {
    const articles = [
      { id: 1, slug: 'article-1', date: new Date().toISOString() },
      { id: 2, slug: 'article-2', date: new Date().toISOString() },
    ] as any[]

    await cacheArticlesFromList(articles)

    expect(memoryCache.get('post:article-1')).toBeDefined()
    expect(memoryCache.get('post:article-2')).toBeDefined()
  })

  it('skips articles without slug', async () => {
    await cacheArticlesFromList([{ id: 1, date: new Date().toISOString() }] as any[])
    expect(memoryCache.size()).toBe(0)
  })

  it('handles empty array gracefully', async () => {
    await expect(cacheArticlesFromList([])).resolves.not.toThrow()
  })

  it('uses default TTL when article has no date', async () => {
    await cacheArticlesFromList([{ id: 1, slug: 'no-date' }] as any[])
    expect(memoryCache.get('post:no-date')).toBeDefined()
  })
})

// ── clearCache ────────────────────────────────────────────────────────────────

describe('clearCache', () => {
  beforeEach(() => {
    memoryCache.clear()
    ;(fileCache.clear as jest.Mock).mockResolvedValue(undefined)
  })

  it('clears all memory cache when no pattern given', async () => {
    memoryCache.set('articles:1', { data: 'x', timestamp: 1 })
    memoryCache.set('post:slug', { data: 'y', timestamp: 2 })
    await clearCache()
    expect(memoryCache.size()).toBe(0)
    expect(fileCache.clear).toHaveBeenCalledWith(undefined)
  })

  it('clears only matching keys when pattern given', async () => {
    memoryCache.set('articles:page1', { data: 'x', timestamp: 1 })
    memoryCache.set('articles:page2', { data: 'y', timestamp: 2 })
    memoryCache.set('post:keep', { data: 'z', timestamp: 3 })

    await clearCache('articles')

    expect(memoryCache.get('articles:page1')).toBeUndefined()
    expect(memoryCache.get('articles:page2')).toBeUndefined()
    expect(memoryCache.get('post:keep')).toBeDefined()
  })
})

// ── cleanExpiredCache ─────────────────────────────────────────────────────────

describe('cleanExpiredCache', () => {
  it('delegates to fileCache.cleanExpired on server', async () => {
    ;(fileCache.cleanExpired as jest.Mock).mockResolvedValue(undefined)
    await cleanExpiredCache()
    expect(fileCache.cleanExpired).toHaveBeenCalled()
  })
})

// ── getCacheStats ─────────────────────────────────────────────────────────────

describe('getCacheStats', () => {
  it('returns stats from fileCache on server', async () => {
    ;(fileCache.getStats as jest.Mock).mockResolvedValue({
      count: 5, size: 2048, permanent: 1, temporary: 4,
    })
    const stats = await getCacheStats()
    expect(stats).toEqual({ count: 5, size: 2048, permanent: 1, temporary: 4 })
  })
})

// ── getCachedArticle ──────────────────────────────────────────────────────────

describe('getCachedArticle', () => {
  beforeEach(() => memoryCache.clear())

  it('returns article data for a cached key', () => {
    const article = { id: 1, slug: 'test' }
    memoryCache.set('post:test', { data: article, timestamp: Date.now() })
    expect(getCachedArticle('post:test')).toEqual(article)
  })

  it('returns null for uncached key', () => {
    expect(getCachedArticle('post:ghost')).toBeNull()
  })
})