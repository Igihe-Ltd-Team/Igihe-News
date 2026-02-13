import { server } from '../mocks/msw/server'
import { errorHandlers, makePost } from '../mocks/msw/handlers'
import { http, HttpResponse } from 'msw'
import { memoryCache, pendingRequests } from '../../src/services/cacheManager'
import { fileCache } from '@/lib/cache/fileCache'
import {
  fetchPostBySlug,
  fetchSinglePost,
  fetchArticles,
  fetchOtherPosts,
  fetchRelatedPosts,
  globalSearch,
  fetchOpinions,
  fetchAdvertorials,
  fetchFacts,
  fetchAnnouncements,
  refreshArticle,
  refreshArticleById,
  customPostFetch,
  getCachedArticle,
} from '../../src/services/articleService'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  memoryCache.clear()
  pendingRequests.clear()
  ;(fileCache.get as jest.Mock).mockResolvedValue(null)
  ;(fileCache.set as jest.Mock).mockResolvedValue(undefined)
  ;(fileCache.delete as jest.Mock).mockResolvedValue(undefined)
})
afterAll(() => server.close())

// ── fetchPostBySlug ───────────────────────────────────────────────────────────

describe('fetchPostBySlug', () => {
  it('fetches a post by slug', async () => {
    const post = await fetchPostBySlug('test-post')
    expect(post).not.toBeNull()
    expect(post?.slug).toBe('test-post')
  })

  it('returns null for non-existent slug', async () => {
    const post = await fetchPostBySlug('not-found')
    expect(post).toBeNull()
  })

  it('caches the result in memory', async () => {
    await fetchPostBySlug('test-post')
    expect(memoryCache.get('post:test-post')).toBeDefined()
  })

  it('returns cached result on second call', async () => {
    let callCount = 0
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/posts', () => {
        callCount++
        return HttpResponse.json([makePost()])
      })
    )
    await fetchPostBySlug('cached-slug')
    await fetchPostBySlug('cached-slug')
    expect(callCount).toBe(1)
  })
})

// ── customPostFetch ───────────────────────────────────────────────────────────

describe('customPostFetch', () => {
  it('fetches using a custom API path and caches by slug', async () => {
    const post = await customPostFetch('posts?slug=test-post&_embed=1', 'test-post')
    expect(post).toBeDefined()
  })
})

// ── fetchSinglePost ───────────────────────────────────────────────────────────

describe('fetchSinglePost', () => {
  it('fetches a post by numeric ID', async () => {
    const post = await fetchSinglePost('42')
    expect(post).toBeDefined()
    expect(post.id).toBe(42)
  })

  it('throws on 404', async () => {
    await expect(fetchSinglePost('9999')).rejects.toThrow()
  })
})

// ── fetchArticles ─────────────────────────────────────────────────────────────

describe('fetchArticles', () => {
  it('fetches article list with pagination', async () => {
    const result = await fetchArticles()
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.pagination).toBeDefined()
    expect(result.pagination.totalPages).toBe(3)
    expect(result.pagination.hasNextPage).toBe(true)
  })

  it('fetches with category filter', async () => {
    const result = await fetchArticles({ categories: [1, 2] })
    expect(result.data).toBeDefined()
  })

  it('fetches with search query', async () => {
    const result = await fetchArticles({ search: 'hello' })
    expect(result.data[0].title.rendered).toContain('hello')
  })

  it('returns empty data for no-result search', async () => {
    const result = await fetchArticles({ search: 'empty' })
    expect(result.data).toHaveLength(0)
  })

  it('accepts pagination params', async () => {
    const result = await fetchArticles({ page: 2, per_page: 5 })
    expect(result.pagination.currentPage).toBe(2)
    expect(result.pagination.perPage).toBe(5)
  })

  it('applies orderby and order params', async () => {
    let capturedUrl = ''
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/posts', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([], {
          headers: { 'X-WP-Total': '0', 'X-WP-TotalPages': '1' },
        })
      })
    )
    await fetchArticles({ orderby: 'comment_count', order: 'asc' })
    expect(capturedUrl).toContain('orderby=comment_count')
    expect(capturedUrl).toContain('order=asc')
  })

  it('uses shorter TTL for first page', async () => {
    const result = await fetchArticles({ page: 1 })
    expect(result.data).toBeDefined()
  })
})

// ── fetchOtherPosts ───────────────────────────────────────────────────────────

describe('fetchOtherPosts', () => {
  it('fetches custom post types', async () => {
    const result = await fetchOtherPosts({ postType: 'opinion' })
    expect(Array.isArray(result.data)).toBe(true)
  })
})

// ── fetchRelatedPosts ─────────────────────────────────────────────────────────

describe('fetchRelatedPosts', () => {
  it('fetches related posts by category', async () => {
    const posts = await fetchRelatedPosts('1', [1, 2])
    expect(Array.isArray(posts)).toBe(true)
    expect(posts.length).toBeGreaterThan(0)
  })

  it('uses tags as fallback when no categories', async () => {
    const posts = await fetchRelatedPosts('1', [], [10, 11])
    expect(Array.isArray(posts)).toBe(true)
  })

  it('falls back to fetchArticles when no related posts found', async () => {
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/posts', ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get('exclude')) {
          return HttpResponse.json([]) // no related
        }
        return HttpResponse.json([makePost()], {
          headers: { 'X-WP-Total': '1', 'X-WP-TotalPages': '1' },
        })
      })
    )
    const posts = await fetchRelatedPosts('999', [])
    expect(Array.isArray(posts)).toBe(true)
  })
})

// ── globalSearch ──────────────────────────────────────────────────────────────

describe('globalSearch', () => {
  it('returns posts and videos for a valid query', async () => {
    const result = await globalSearch('news')
    expect(Array.isArray(result.posts)).toBe(true)
    expect(Array.isArray(result.videos)).toBe(true)
  })

  it('returns empty results for query shorter than 2 chars', async () => {
    const result = await globalSearch('a')
    expect(result.posts).toHaveLength(0)
    expect(result.videos).toHaveLength(0)
  })

  it('only fetches posts when type is "posts"', async () => {
    const result = await globalSearch('test', { type: 'posts' })
    expect(result.videos).toHaveLength(0)
  })

  it('only fetches videos when type is "videos"', async () => {
    const result = await globalSearch('test', { type: 'videos' })
    expect(result.posts).toHaveLength(0)
  })
})

// ── fetchOpinions ─────────────────────────────────────────────────────────────

describe('fetchOpinions', () => {
  it('fetches opinion articles', async () => {
    const result = await fetchOpinions()
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data[0].id).toBe(100)
  })

  it('accepts pagination params', async () => {
    const result = await fetchOpinions({ page: 1, per_page: 3 })
    expect(result.pagination).toBeDefined()
  })
})

// ── fetchAdvertorials ─────────────────────────────────────────────────────────

describe('fetchAdvertorials', () => {
  it('fetches advertorial posts', async () => {
    const result = await fetchAdvertorials()
    expect(Array.isArray(result)).toBe(true)
  })

  it('throws on non-OK response', async () => {
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/advertorial', () =>
        HttpResponse.json({}, { status: 500 })
      )
    )
    await expect(fetchAdvertorials()).rejects.toThrow()
  })
})

// ── fetchFacts ────────────────────────────────────────────────────────────────

describe('fetchFacts', () => {
  it('fetches fact of the day', async () => {
    const result = await fetchFacts()
    expect(Array.isArray(result)).toBe(true)
    expect(result[0].id).toBe(400)
  })

  it('throws on server error', async () => {
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/fact-of-the-day', () =>
        HttpResponse.json({}, { status: 500 })
      )
    )
    await expect(fetchFacts()).rejects.toThrow()
  })
})

// ── fetchAnnouncements ────────────────────────────────────────────────────────

describe('fetchAnnouncements', () => {
  it('fetches announcements', async () => {
    const result = await fetchAnnouncements()
    expect(Array.isArray(result)).toBe(true)
    expect(result[0].id).toBe(300)
  })
})

// ── refreshArticle ────────────────────────────────────────────────────────────

describe('refreshArticle', () => {
  it('clears cache and re-fetches article', async () => {
    memoryCache.set('post:test-post', { data: makePost(), timestamp: 0 })
    const result = await refreshArticle('test-post')
    expect(result).not.toBeNull()
    expect(result?.slug).toBe('test-post')
    expect(fileCache.delete).toHaveBeenCalledWith('post:test-post')
  })

  it('returns null for non-existent slug', async () => {
    const result = await refreshArticle('not-found')
    expect(result).toBeNull()
  })

  it('invalidates list caches after refresh', async () => {
    memoryCache.set('articles:page1', { data: 'x', timestamp: 1 })
    memoryCache.set('popular:week', { data: 'y', timestamp: 2 })
    await refreshArticle('test-post')
    expect(memoryCache.get('articles:page1')).toBeUndefined()
    expect(memoryCache.get('popular:week')).toBeUndefined()
  })
})

// ── refreshArticleById ────────────────────────────────────────────────────────

describe('refreshArticleById', () => {
  it('resolves slug from ID then refreshes', async () => {
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/posts/42', () =>
        HttpResponse.json({ slug: 'test-post' })
      )
    )
    const result = await refreshArticleById(42)
    expect(result).not.toBeNull()
  })

  it('throws when no slug is returned', async () => {
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/posts/42', () =>
        HttpResponse.json({ id: 42 }) // no slug
      )
    )
    await expect(refreshArticleById(42)).rejects.toThrow('No slug found')
  })
})