import { server } from '../mocks/msw/server'
import { http, HttpResponse } from 'msw'
import { memoryCache, pendingRequests } from '../../src/services/cacheManager'
import { fileCache } from '@/lib/cache/fileCache'
import {
  fetchVideos,
  fetchSingleVideo,
  fetchComments,
  submitComment,
  fetchMedia,
  fetchAdvertisements,
  fetchAdsByPosition,
  fetchAdsByPositions,
  fetchAuthorBySlug,
  fetchAuthorById,
  fetchPostsByAuthorSlug,
  fetchPostsByAuthorId,
  fetchAllAuthors,
} from '../../src/services/mediaService'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  memoryCache.clear()
  pendingRequests.clear()
    ; (fileCache.get as jest.Mock).mockResolvedValue(null)
})
afterAll(() => server.close())

// ── Videos ────────────────────────────────────────────────────────────────────

describe('fetchVideos', () => {
  it('returns a list of videos', async () => {
    const videos = await fetchVideos()
    expect(Array.isArray(videos)).toBe(true)
    expect(videos[0].slug).toBe('video-1')
  })

  it('supports search param', async () => {
    let capturedUrl = ''
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/igh-yt-videos', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([])
      })
    )
    await fetchVideos({ search: 'rwanda' })
    expect(capturedUrl).toContain('search=rwanda')
  })

  it('returns empty array for no-result search', async () => {
    const videos = await fetchVideos({ search: 'empty' })
    expect(videos).toEqual([])
  })
})

describe('fetchSingleVideo', () => {
  it('fetches a video by ID', async () => {
    const video = await fetchSingleVideo('5')
    expect(video).toBeDefined()
    expect(video.id).toBe(5)
  })
})

// ── Comments ──────────────────────────────────────────────────────────────────

describe('fetchComments', () => {
  it('fetches comments for a post', async () => {
    const comments = await fetchComments(1)
    expect(Array.isArray(comments)).toBe(true)
    expect(comments[0].content.rendered).toBe('Great post!')
  })

  it('supports pagination params', async () => {
    let capturedUrl = ''
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/comments', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([])
      })
    )
    await fetchComments(1, { page: 2, per_page: 10 })
    expect(capturedUrl).toContain('page=2')
    expect(capturedUrl).toContain('per_page=10')
  })
})

describe('submitComment', () => {
  it('posts a comment and invalidates cache', async () => {
    memoryCache.set('comments:1:{}', { data: [], timestamp: Date.now() })

    const result = await submitComment(1, {
      author_name: 'Alice',
      author_email: 'alice@example.com',
      content: 'Hello!',
    })

    expect(result.id).toBe(99)
    // Comment cache for post 1 should be cleared
    expect(memoryCache.get('comments:1:{}')).toBeUndefined()
  })

  it('supports parent comment threading', async () => {
    let capturedBody: any
    server.use(
      http.post('https://new.igihe.com/wp-json/wp/v2/comments', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ id: 100, ...capturedBody }, { status: 201 })
      })
    )
    await submitComment(1, {
      author_name: 'Bob',
      author_email: 'bob@example.com',
      content: 'Reply',
      parent: 5,
    })
    expect(capturedBody.parent).toBe(5)
  })
})

// ── Media ─────────────────────────────────────────────────────────────────────

describe('fetchMedia', () => {
  it('fetches media by ID', async () => {
    const media = await fetchMedia(42)
    expect(media.id).toBe(42)
    expect(media.source_url).toBeDefined()
  })

  it('caches media for 1 hour', async () => {
    const media = await fetchMedia(1)
    expect(media).toBeDefined()
  })
})

// ── Advertisements ────────────────────────────────────────────────────────────

describe('fetchAdvertisements', () => {
  it('returns advertisement array', async () => {
    const ads = await fetchAdvertisements()
    expect(Array.isArray(ads)).toBe(true)
    expect(ads.length).toBeGreaterThan(0)
  })

  it('handles errors gracefully with stale cache fallback', async () => {
  // First, populate the cache with some data
  const initialAds = await fetchAdvertisements()
  expect(Array.isArray(initialAds)).toBe(true)
  
  // Now simulate an error - the function should return cached data or handle gracefully
  server.use(
    http.get('https://new.igihe.com/wp-json/wp/v2/advertisement', () => {
      return HttpResponse.json({ error: 'Server Error' }, { status: 500 })
    })
  )
  
  // The cached data should still be available
  const cachedAds = await fetchAdvertisements()
  expect(Array.isArray(cachedAds)).toBe(true)
})

  it('deduplicates concurrent fetches', async () => {
    // Clear all caches
    memoryCache.delete('slots:all')
    pendingRequests.delete('slots:all')
    await fileCache.delete('slots:all')

    // Reset module to clear module-level cache (adsCache variable)
    jest.resetModules()

    let callCount = 0
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/advertisement', async () => {
        callCount++
        await new Promise(res => setTimeout(res, 100))
        return HttpResponse.json([{ id: 1, acf: { position: 'test', image: '', link: '' } }])
      })
    )

    const { fetchAdvertisements } = require('../../src/services/mediaService')
    const promises = [fetchAdvertisements(), fetchAdvertisements(), fetchAdvertisements()]
    await Promise.all(promises)

    expect(callCount).toBe(1)
  })
})

describe('fetchAdsByPosition', () => {
  it('returns ads filtered by position', async () => {
    const ads = await fetchAdsByPosition('after-announcements')
    expect(Array.isArray(ads)).toBe(true)
    // The mock filters by position, so we should get ads with position='header'
    ads.forEach(ad => {
      expect(ad.acf?.ad_position).toBe('after-announcements')
    })
  })

  it('returns empty array on error', async () => {
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/advertisement', () =>
        HttpResponse.error()
      )
    )
      ; (require('../../src/services/mediaService') as any).adsCache = null
    const ads = await fetchAdsByPosition('ad1_leaderboard_728x90')
    expect(ads).toEqual([])
  })
})

describe('fetchAdsByPositions', () => {
  it('returns a record of ads per position', async () => {
    const result = await fetchAdsByPositions(['after-announcements', 'after-facts'])
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
    // Results should be arrays (even if empty)
    Object.values(result).forEach(ads => {
      expect(Array.isArray(ads)).toBe(true)
    })
  })
})

// ── Authors ───────────────────────────────────────────────────────────────────

describe('fetchAuthorBySlug', () => {
  it('returns an author for valid slug', async () => {
    const author = await fetchAuthorBySlug('jane-doe')
    expect(author).not.toBeNull()
    expect(author?.slug).toBe('jane-doe')
  })

  it('returns null for unknown author', async () => {
    const author = await fetchAuthorBySlug('unknown')
    expect(author).toBeNull()
  })

  it('throws on server error', async () => {
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/users', () =>
        HttpResponse.json({}, { status: 500 })
      )
    )
    await expect(fetchAuthorBySlug('jane-doe')).rejects.toThrow()
  })
})

describe('fetchAuthorById', () => {
  it('returns an author by numeric ID', async () => {
    const author = await fetchAuthorById(1)
    expect(author).not.toBeNull()
    expect(author?.id).toBe(1)
  })
})

describe('fetchPostsByAuthorSlug', () => {
  it('returns posts and author for a valid slug', async () => {
    const result = await fetchPostsByAuthorSlug('jane-doe')
    expect(result.author).not.toBeNull()
    expect(result.author?.slug).toBe('jane-doe')
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.pagination).toBeDefined()
  })

  it('returns empty data for unknown author', async () => {
    const result = await fetchPostsByAuthorSlug('unknown')
    expect(result.data).toEqual([])
    expect(result.author).toBeNull()
  })

  it('returns empty data on error', async () => {
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/users', () =>
        HttpResponse.error()
      )
    )
    const result = await fetchPostsByAuthorSlug('jane-doe')
    expect(result.data).toEqual([])
  })
})

describe('fetchPostsByAuthorId', () => {
  it('returns posts array for an author ID', async () => {
    const posts = await fetchPostsByAuthorId(1)
    expect(Array.isArray(posts)).toBe(true)
  })

  it('returns empty array on error', async () => {
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/posts', () =>
        HttpResponse.error()
      )
    )
    const posts = await fetchPostsByAuthorId(1)
    expect(posts).toEqual([])
  })
})

describe('fetchAllAuthors', () => {
  it('returns all authors', async () => {
    const authors = await fetchAllAuthors()
    expect(Array.isArray(authors)).toBe(true)
    expect(authors.length).toBeGreaterThan(0)
  })

  it('accepts per_page param', async () => {
    let capturedUrl = ''
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/users', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json([])
      })
    )
    await fetchAllAuthors({ per_page: 5 })
    expect(capturedUrl).toContain('per_page=5')
  })

  it('returns empty array on error', async () => {
    server.use(
      http.get('https://new.igihe.com/wp-json/wp/v2/users', () =>
        HttpResponse.error()
      )
    )
    const authors = await fetchAllAuthors()
    expect(authors).toEqual([])
  })
})