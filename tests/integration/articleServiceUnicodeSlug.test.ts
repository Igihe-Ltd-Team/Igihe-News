import { server } from '../mocks/msw/server'
import { makePost } from '../mocks/msw/handlers'
import { http, HttpResponse } from 'msw'
import { memoryCache, pendingRequests } from '../../src/services/cacheManager'
import { customPostFetch, fetchPostBySlug } from '../../src/services/articleService'

const BASE = 'https://new.igihe.com/english/wp-json/wp/v2'

// A real one: WordPress reports this slug but its `?slug=` filter never matches it.
const SLUG = 'ngugĩ-wa-thiong-o-the-defiant-wordsmith-who-rewrote-the-african-narrative'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  memoryCache.clear()
  pendingRequests.clear()
})
afterAll(() => server.close())

/** Mocks WordPress the way production behaves: slug filter finds nothing, search and ID lookups work. */
function mockWordPress(options: { endpoint?: string; candidates?: Array<{ id: number; slug: string }> } = {}) {
  const endpoint = options.endpoint ?? 'posts'
  const candidates = options.candidates ?? [{ id: 54328, slug: SLUG }]
  const requests: URL[] = []

  server.use(
    http.get(`${BASE}/${endpoint}`, ({ request }) => {
      const url = new URL(request.url)
      requests.push(url)
      if (url.searchParams.has('search')) return HttpResponse.json(candidates)
      return HttpResponse.json([]) // ?slug= never matches a non-ASCII slug
    }),
    http.get(`${BASE}/${endpoint}/:id`, ({ params, request }) => {
      requests.push(new URL(request.url))
      return HttpResponse.json(makePost({ id: Number(params.id), slug: SLUG }))
    })
  )
  return requests
}

describe('posts whose slug WordPress cannot filter on', () => {
  it('finds the post by searching its words and loading the exact match by ID', async () => {
    const requests = mockWordPress()

    const post = await fetchPostBySlug(SLUG)

    expect(post?.id).toBe(54328)
    expect(requests.map(url => url.pathname.replace('/english/wp-json/wp/v2', ''))).toEqual(['/posts', '/posts', '/posts/54328'])
    const search = requests[1].searchParams
    expect(search.get('search')).toBe('narrative wordsmith african defiant rewrote')
    expect(search.get('per_page')).toBe('100')
    expect(search.get('_fields')).toBe('id,slug')
    expect(requests[2].searchParams.get('_embed')).toBe('1')
  })

  it('matches regardless of Unicode normalisation of the requested slug', async () => {
    mockWordPress()
    const post = await fetchPostBySlug(SLUG.normalize('NFD'))
    expect(post?.id).toBe(54328)
  })

  it('never returns a near match: only the candidate whose slug is exactly the requested one', async () => {
    const requests = mockWordPress({
      candidates: [{ id: 1, slug: 'ngug-wa-thiong-o-something-else' }, { id: 2, slug: `${SLUG}-2` }],
    })

    expect(await fetchPostBySlug(SLUG)).toBeNull()
    // Narrow search, then the broader retry with the two longest words, and no ID lookup.
    const searches = requests.filter(url => url.searchParams.has('search'))
    expect(searches.map(url => url.searchParams.get('search'))).toEqual([
      'narrative wordsmith african defiant rewrote',
      'narrative wordsmith',
    ])
    expect(requests.some(url => /\/posts\/\d+$/.test(url.pathname))).toBe(false)
  })

  it('does not search at all for ordinary slugs', async () => {
    const requests = mockWordPress()
    expect(await fetchPostBySlug('plain-missing-slug')).toBeNull()
    expect(requests).toHaveLength(1)
    expect(requests[0].searchParams.get('slug')).toBe('plain-missing-slug')
  })

  it('searches the right endpoint for custom post types', async () => {
    const requests = mockWordPress({ endpoint: 'opinion' })

    const post = await customPostFetch(`opinion?slug=${encodeURIComponent(SLUG)}&_embed`, SLUG)

    expect(post?.id).toBe(54328)
    expect(requests.map(url => url.pathname.replace('/english/wp-json/wp/v2', ''))).toEqual(['/opinion', '/opinion', '/opinion/54328'])
  })

  it('encodes the slug in the primary query so characters like & cannot corrupt it', async () => {
    const requests = mockWordPress({ candidates: [] })
    await fetchPostBySlug('tom & jerry')
    // Unencoded, `&` would end the parameter and WordPress would see slug="tom ".
    expect(requests[0].searchParams.get('slug')).toBe('tom & jerry')
  })

  it('does not cache a WordPress failure as "not found"', async () => {
    server.use(
      http.get(`${BASE}/posts`, ({ request }) =>
        new URL(request.url).searchParams.has('search')
          ? HttpResponse.error() // a network failure (non-OK mock responses hang on body.cancel() under MSW)
          : HttpResponse.json([])
      )
    )

    // fetchWithTimeout retries every error with a 1s/2s/4s backoff. Each retry
    // schedules its timer only after the previous response arrives, so advance
    // the clock in steps until the call settles instead of waiting in real time.
    const realSetTimeout = setTimeout
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] })
    try {
      let outcome: 'pending' | 'resolved' | 'rejected' = 'pending'
      fetchPostBySlug(SLUG).then(
        () => { outcome = 'resolved' },
        () => { outcome = 'rejected' }
      )
      // The mock server answers in real time, so give it a few real ms per step.
      for (let step = 0; step < 400 && outcome === 'pending'; step++) {
        await jest.advanceTimersByTimeAsync(500)
        await new Promise(resolve => realSetTimeout(resolve, 5))
      }
      expect(outcome).toBe('rejected')
    } finally {
      jest.useRealTimers()
    }

    // WordPress recovers: the next request must look again rather than serve a cached null.
    mockWordPress()
    const post = await fetchPostBySlug(SLUG)
    expect(post?.id).toBe(54328)
  })
})
