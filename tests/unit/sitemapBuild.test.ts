import {
  buildArticleEntries,
  buildAuthorEntries,
  buildCategoryEntries,
  buildEntries,
  buildPageEntries,
  chunkArticles,
  resolveArticleSection,
} from '@/lib/sitemap/build'
import { TIERS } from '@/lib/sitemap/config'
import type { Inventory } from '@/lib/sitemap/types'

jest.mock('@/data/authorAliases', () => ({
  authorAliases: {
    version: 1,
    generatedAt: '',
    groups: [
      {
        canonical: 'al-jazeera',
        canonicalId: 10,
        name: 'AL JAZEERA',
        confidence: 'typo',
        aliases: [{ slug: 'al-jaazeera', id: 11, name: 'Al Jaazeera', count: 1 }],
      },
    ],
  },
}))

function inventory(overrides: Partial<Inventory> = {}): Inventory {
  return {
    version: 1,
    syncedAt: '2026-09-15T08:00:00Z',
    fullSyncAt: '2026-09-15T08:00:00Z',
    categories: [
      { id: 1, slug: 'news', name: 'News', count: 2 },
      { id: 2, slug: 'business', name: 'Business', count: 1 },
      { id: 3, slug: 'empty', name: 'Empty', count: 0 },
    ],
    bylines: [
      { id: 10, slug: 'al-jazeera', name: 'AL JAZEERA', count: 4 },
      { id: 11, slug: 'al-jaazeera', name: 'Al Jaazeera', count: 1 },
      { id: 12, slug: 'one-off', name: 'One Off', count: 1 },
    ],
    articles: [
      { id: 100, type: 'post', slug: 'oldest', date: '2020-01-01T00:00:00Z', modified: '2020-01-02T00:00:00Z', categories: [1], bylines: [10] },
      { id: 101, type: 'post', slug: 'newer', date: '2026-09-10T10:00:00Z', modified: '2026-09-12T09:30:00Z', categories: [2, 1], bylines: [10, 11] },
      { id: 102, type: 'post', slug: 'newest', date: '2026-09-15T07:00:00Z', modified: '2026-09-15T07:00:00Z', categories: [1], bylines: [10] },
      { id: 200, type: 'opinion', slug: 'my-view', date: '2026-09-01T00:00:00Z', modified: '2026-09-01T00:00:00Z', categories: [], bylines: [10] },
      { id: 300, type: 'advertorial', slug: 'sponsored', date: '2025-04-04T19:50:04Z', modified: '2025-04-04T19:57:58Z', categories: [], bylines: [10] },
      { id: 400, type: 'announcement', slug: 'notice', date: '2025-08-23T10:02:13Z', modified: '2025-08-23T10:04:01Z', categories: [], bylines: [12] },
    ],
    videos: [{ id: 500, slug: 'clip', date: '2026-09-13T14:08:02Z', modified: '2026-09-13T14:08:02Z' }],
    ...overrides,
  }
}

describe('article URLs', () => {
  const slugs = new Map([[1, 'news'], [2, 'business']])

  it('uses the first category slug for posts and fixed sections for custom types', () => {
    expect(resolveArticleSection({ type: 'post', categories: [2, 1] }, slugs)).toBe('business')
    expect(resolveArticleSection({ type: 'post', categories: [99] }, slugs)).toBe('news')
    expect(resolveArticleSection({ type: 'opinion', categories: [] }, slugs)).toBe('opinion')
    expect(resolveArticleSection({ type: 'advertorial', categories: [] }, slugs)).toBe('advertorials')
    expect(resolveArticleSection({ type: 'announcement', categories: [] }, slugs)).toBe('announcements')
  })

  it('emits each article with its own modified time, oldest first', () => {
    const entries = buildArticleEntries(inventory())
    expect(entries.map(e => e.loc)).toEqual([
      'https://en.igihe.com/news/article/oldest',
      'https://en.igihe.com/advertorials/article/sponsored',
      'https://en.igihe.com/announcements/article/notice',
      'https://en.igihe.com/opinion/article/my-view',
      'https://en.igihe.com/business/article/newer',
      'https://en.igihe.com/news/article/newest',
    ])
    expect(entries[0].lastmod).toBe('2020-01-02T00:00:00Z')
    expect(entries[4].lastmod).toBe('2026-09-12T09:30:00Z')
    expect(entries.every(e => e.priority === TIERS.article.priority && e.changefreq === TIERS.article.changefreq)).toBe(true)
    expect(new Set(entries.map(e => e.lastmod)).size).toBe(entries.length)
  })
})

describe('listing pages', () => {
  it('derives lastmod from content, never from the build time', () => {
    const pages = buildPageEntries(inventory())
    const byPath = Object.fromEntries(pages.map(page => [page.loc, page]))
    expect(byPath['https://en.igihe.com'].lastmod).toBe('2026-09-15T07:00:00Z')
    expect(byPath['https://en.igihe.com'].priority).toBe(1)
    expect(byPath['https://en.igihe.com'].changefreq).toBe('hourly')
    expect(byPath['https://en.igihe.com/videos'].lastmod).toBe('2026-09-13T14:08:02Z')
    expect(byPath['https://en.igihe.com/opinion'].lastmod).toBe('2026-09-01T00:00:00Z')
    expect(byPath['https://en.igihe.com/advertorials'].lastmod).toBe('2025-04-04T19:50:04Z')
    expect(byPath['https://en.igihe.com/announcements'].lastmod).toBe('2025-08-23T10:02:13Z')
    expect(byPath['https://en.igihe.com/author'].lastmod).toBeUndefined()
    expect(byPath['https://en.igihe.com/services'].lastmod).toBeUndefined()
    const before = Date.now() - 60_000
    pages.forEach(page => {
      if (page.lastmod) expect(Date.parse(page.lastmod)).toBeLessThan(before)
    })
  })

  it('gives each category the publish time of its latest article', () => {
    const categories = buildCategoryEntries(inventory())
    const byLoc = Object.fromEntries(categories.map(c => [c.loc, c]))
    expect(byLoc['https://en.igihe.com/news'].lastmod).toBe('2026-09-15T07:00:00Z')
    expect(byLoc['https://en.igihe.com/business'].lastmod).toBe('2026-09-10T10:00:00Z')
    expect(byLoc['https://en.igihe.com/empty'].lastmod).toBeUndefined()
    expect(byLoc['https://en.igihe.com/news'].priority).toBe(0.8)
    expect(byLoc['https://en.igihe.com/news'].changefreq).toBe('daily')
  })

  it('only ever uses timestamps that come from content records', () => {
    const inv = inventory()
    const contentDates = new Set([
      ...inv.articles.flatMap(a => [a.date, a.modified]),
      ...inv.videos.flatMap(v => [v.date, v.modified]),
    ])
    const { pages, categories, articles, videos, authors } = buildEntries(inv)
    const all = [...pages, ...categories, ...articles, ...videos, ...authors]
    expect(all.length).toBeGreaterThan(10)
    for (const item of all) {
      if (item.lastmod) expect(contentDates.has(item.lastmod)).toBe(true)
    }
    // Sections with different latest articles get different timestamps.
    const byLoc = Object.fromEntries(categories.map(c => [c.loc, c.lastmod]))
    expect(byLoc['https://en.igihe.com/news']).not.toBe(byLoc['https://en.igihe.com/business'])
  })
})

describe('duplicate URLs', () => {
  it('lists a category that shares its URL with a static page only once', () => {
    const inv = inventory({
      categories: [
        { id: 1, slug: 'news', name: 'News', count: 2 },
        { id: 7, slug: 'opinion', name: 'Opinion', count: 9 },
        { id: 8, slug: 'videos', name: 'Videos', count: 3 },
      ],
    })
    const { pages, categories } = buildEntries(inv)
    const all = [...pages, ...categories].map(e => e.loc)
    expect(new Set(all).size).toBe(all.length)
    expect(categories.map(c => c.loc)).toEqual(['https://en.igihe.com/news'])
  })
})

describe('authors', () => {
  it('drops alias spellings and thin archives, merges counts and dates into the canonical author', () => {
    const authors = buildAuthorEntries(inventory())
    expect(authors.map(a => a.loc)).toEqual(['https://en.igihe.com/author/al-jazeera'])
    expect(authors[0].lastmod).toBe('2026-09-15T07:00:00Z')
    expect(authors[0].priority).toBe(0.3)
    expect(authors[0].changefreq).toBe('monthly')
  })
})

describe('chunking', () => {
  it('splits into files of the configured size, oldest first', () => {
    const entries = buildArticleEntries(inventory())
    const chunks = chunkArticles(entries, 4)
    expect(chunks.map(chunk => chunk.length)).toEqual([4, 2])
    expect(chunks[0][0].loc).toContain('/oldest')
    expect(chunkArticles([], 4)).toEqual([])
  })
})
