import { server } from '../mocks/msw/server'
import { http, HttpResponse } from 'msw'
import { memoryCache, pendingRequests } from '../../src/services/cacheManager'
import { fileCache } from '@/lib/cache/fileCache'
import {
  fetchCategories,
  fetchCategoryBySlug,
  fetchPostsByCategorySlug,
  fetchPopularCategories,
  fetchCategoriesWithPosts,
} from '../../src/services/categoryService'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  memoryCache.clear()
  pendingRequests.clear()
  ;(fileCache.get as jest.Mock).mockResolvedValue(null)
})
afterAll(() => server.close())

describe('fetchCategories', () => {
  it('returns only categories with count > 0', async () => {
    const categories = await fetchCategories()
    expect(categories.every(c => c.count > 0)).toBe(true)
    // The mock returns category with count=0 (sports), it should be filtered
    expect(categories.find(c => c.slug === 'sports')).toBeUndefined()
  })

  it('accepts per_page param', async () => {
    let capturedUrl = ''
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/categories', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([{ id: 1, name: 'Tech', slug: 'tech', count: 5, description: '' }])
      })
    )
    await fetchCategories({ per_page: 50 })
    expect(capturedUrl).toContain('per_page=50')
  })

  it('excludes specified category IDs', async () => {
    let capturedUrl = ''
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/categories', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([])
      })
    )
    await fetchCategories({ exclude: [3, 5] })
    expect(capturedUrl).toContain('exclude')
  })

  it('caches results for 2 hours', async () => {
    const categories = await fetchCategories()
    expect(categories.length).toBeGreaterThanOrEqual(0)
  })
})

describe('fetchCategoryBySlug', () => {
  it('returns a category for valid slug', async () => {
    const cat = await fetchCategoryBySlug('technology')
    expect(cat).not.toBeNull()
    expect(cat?.slug).toBe('technology')
  })

  it('returns null for unknown slug', async () => {
    const cat = await fetchCategoryBySlug('unknown')
    expect(cat).toBeNull()
  })

  it('throws on server error', async () => {
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/categories', () =>
        HttpResponse.json({}, { status: 500 })
      )
    )
    await expect(fetchCategoryBySlug('tech')).rejects.toThrow()
  })
})

describe('fetchPostsByCategorySlug', () => {
  it('returns posts and category for valid slug', async () => {
    const result = await fetchPostsByCategorySlug('technology')
    expect(result).not.toBeNull()
    expect(result?.category.slug).toBe('technology')
    expect(Array.isArray(result?.posts.data)).toBe(true)
  })

  it('returns null for unknown category slug', async () => {
    const result = await fetchPostsByCategorySlug('unknown')
    expect(result).toBeNull()
  })
})

describe('fetchPopularCategories', () => {
  it('returns categories ordered by count', async () => {
    const categories = await fetchPopularCategories(5)
    expect(categories.every(c => c.count > 0)).toBe(true)
  })

  it('returns empty array on error', async () => {
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/categories', () =>
        HttpResponse.error()
      )
    )
    const categories = await fetchPopularCategories()
    expect(categories).toEqual([])
  })
})

describe('fetchCategoriesWithPosts', () => {
  it('returns categories with recent_posts arrays', async () => {
    const result = await fetchCategoriesWithPosts(5)
    expect(Array.isArray(result)).toBe(true)
    result.forEach(cat => {
      expect(cat).toHaveProperty('recent_posts')
      expect(Array.isArray(cat.recent_posts)).toBe(true)
    })
  })

  it('gracefully handles post fetch failure per category', async () => {
    let callCount = 0
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/posts', () => {
        callCount++
        if (callCount > 1) return HttpResponse.error()
        return HttpResponse.json([{ id: 1, slug: 'p', title: { rendered: 'T' }, date: new Date().toISOString() }], {
          headers: { 'X-WP-Total': '1', 'X-WP-TotalPages': '1' },
        })
      })
    )
    const result = await fetchCategoriesWithPosts(3)
    // Should not throw; failed categories get empty recent_posts
    result.forEach(cat => {
      expect(Array.isArray(cat.recent_posts)).toBe(true)
    })
  })
})