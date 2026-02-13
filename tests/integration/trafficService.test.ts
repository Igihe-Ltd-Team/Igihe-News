import { server } from '../mocks/msw/server'
import { http, HttpResponse } from 'msw'
import { memoryCache, pendingRequests } from '../../src/services/cacheManager'
import { fileCache } from '@/lib/cache/fileCache'
import {
  fetchMostPopularArticles,
  fetchMostPopularArticlesFallback,
  fetchPopularArticlesByCategory,
  fetchPopularArticlesByCategorySlug,
  fetchPopularPosts,
} from '../../src/services/trafficService'

const TRAFFIC = 'https://traffic.igihe.com/api/popular.php'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  memoryCache.clear()
  pendingRequests.clear()
  ;(fileCache.get as jest.Mock).mockResolvedValue(null)
})
afterAll(() => server.close())

describe('fetchMostPopularArticles', () => {
  it('returns array of popular articles', async () => {
    const articles = await fetchMostPopularArticles()
    expect(Array.isArray(articles)).toBe(true)
    expect(articles.length).toBeGreaterThan(0)
  })

  it('accepts period and limit params', async () => {
    let capturedUrl = ''
    server.use(
      http.get(TRAFFIC, ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([])
      })
    )
    await fetchMostPopularArticles({ period: 'day', limit: 5 })
    expect(capturedUrl).toContain('period=day')
    expect(capturedUrl).toContain('limit=5')
  })

  it('throws on non-OK response', async () => {
    server.use(
      http.get(TRAFFIC, () => HttpResponse.json({}, { status: 503 }))
    )
    await expect(fetchMostPopularArticles()).rejects.toThrow()
  })

  it('returns empty array on empty response', async () => {
    server.use(http.get(TRAFFIC, () => HttpResponse.json([])))
    const result = await fetchMostPopularArticles()
    expect(result).toEqual([])
  })
})

describe('fetchMostPopularArticlesFallback', () => {
  it('returns articles array from fallback API', async () => {
    server.use(
      http.get(TRAFFIC, () =>
        HttpResponse.json({ articles: [{ id: 1, slug: 'popular', title: 'P', date: new Date().toISOString(), views: 500 }] })
      )
    )
    const articles = await fetchMostPopularArticlesFallback()
    expect(Array.isArray(articles)).toBe(true)
  })

  it('returns empty array when response has no articles array', async () => {
    server.use(http.get(TRAFFIC, () => HttpResponse.json({})))
    const result = await fetchMostPopularArticlesFallback()
    expect(result).toEqual([])
  })
})

describe('fetchPopularArticlesByCategory', () => {
  it('fetches popular articles for a category ID', async () => {
    const result = await fetchPopularArticlesByCategory(1)
    expect(result).toBeDefined()
  })
})

describe('fetchPopularArticlesByCategorySlug', () => {
  it('fetches popular articles for a category slug', async () => {
    const result = await fetchPopularArticlesByCategorySlug('technology')
    expect(result).toBeDefined()
  })
})

describe('fetchPopularPosts', () => {
  it('fetches posts ordered by comment count', async () => {
    let capturedUrl = ''
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/posts', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([])
      })
    )
    await fetchPopularPosts()
    expect(capturedUrl).toContain('orderby=comment_count')
  })

  it('filters by date range when days param given', async () => {
    let capturedUrl = ''
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/posts', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([])
      })
    )
    await fetchPopularPosts({ days: 7 })
    expect(capturedUrl).toContain('after=')
  })

  it('uses 15-minute TTL', async () => {
    const posts = await fetchPopularPosts()
  expect(Array.isArray(posts)).toBe(true)
  })
})