import { http, HttpResponse } from 'msw'

const BASE = 'https://new.igihe.com/wp-json/wp/v2'
const TRAFFIC = 'https://traffic.igihe.com/api/popular.php'

// ── Factories ────────────────────────────────────────────────────────────────

export function makePost(overrides: Partial<any> = {}) {
  return {
    id: 1,
    slug: 'test-post',
    title: { rendered: 'Test Post' },
    content: { rendered: '<p>Content</p>' },
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    modified: new Date().toISOString(),
    categories: [1, 2],
    tags: [10],
    featured_media: 5,
    comment_count: 3,
    _embedded: {},
    ...overrides,
  }
}

export function makeCategory(overrides: Partial<any> = {}) {
  return {
    id: 1,
    name: 'Technology',
    slug: 'technology',
    count: 42,
    description: 'Tech articles',
    ...overrides,
  }
}

export function makeAuthor(overrides: Partial<any> = {}) {
  return {
    id: 1,
    name: 'Jane Doe',
    slug: 'jane-doe',
    description: 'Reporter',
    avatar_urls: { '96': 'https://example.com/avatar.jpg' },
    ...overrides,
  }
}

export function makeAd(overrides: Partial<any> = {}) {
  return {
    id: 1,
    acf: { position: 'header', image: 'https://example.com/ad.jpg', link: 'https://example.com' },
    ...overrides,
  }
}

// Pagination response headers helper
function paginationHeaders(total = 20, totalPages = 2) {
  return {
    'X-WP-Total': String(total),
    'X-WP-TotalPages': String(totalPages),
    'Content-Type': 'application/json',
  }
}

// ── Handlers ─────────────────────────────────────────────────────────────────

export const handlers = [
  // Posts by slug
  http.get(`${BASE}/posts`, ({ request }) => {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')
    const search = url.searchParams.get('search')
    const page = Number(url.searchParams.get('page') || 1)

    if (slug) {
      const post = slug === 'not-found' ? [] : [makePost({ slug })]
      return HttpResponse.json(post, { headers: paginationHeaders() })
    }

    if (search) {
      return HttpResponse.json(
        search === 'empty' ? [] : [makePost({ title: { rendered: `Result for ${search}` } })],
        { headers: paginationHeaders() }
      )
    }

    return HttpResponse.json(
      [makePost({ id: page * 10 }), makePost({ id: page * 10 + 1 })],
      { headers: paginationHeaders(20, 3) }
    )
  }),

  // Single post by ID
  http.get(`${BASE}/posts/:id`, ({ params }) => {
    const id = Number(params.id)
    if (id === 9999) return HttpResponse.json({ message: 'Not Found' }, { status: 404 })
    return HttpResponse.json(makePost({ id }))
  }),

  // Categories
  http.get(`${BASE}/categories`, ({ request }) => {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')

    if (slug) {
      if (slug === 'unknown') return HttpResponse.json([])
      return HttpResponse.json([makeCategory({ slug })])
    }

    return HttpResponse.json([
      makeCategory({ id: 1, slug: 'technology', count: 42 }),
      makeCategory({ id: 2, slug: 'sports', count: 0 }),
      makeCategory({ id: 3, slug: 'politics', count: 15 }),
    ])
  }),

  // Users
  http.get(`${BASE}/users`, ({ request }) => {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')
    if (slug) {
      if (slug === 'unknown') return HttpResponse.json([])
      return HttpResponse.json([makeAuthor({ slug })])
    }
    return HttpResponse.json([makeAuthor(), makeAuthor({ id: 2, slug: 'john-doe', name: 'John' })])
  }),

  http.get(`${BASE}/users/:id`, ({ params }) => {
    return HttpResponse.json(makeAuthor({ id: Number(params.id) }))
  }),

  // Custom post types
  http.get(`${BASE}/opinion`, () => {
    return HttpResponse.json([makePost({ id: 100 }), makePost({ id: 101 })], {
      headers: paginationHeaders(10, 2),
    })
  }),

  http.get(`${BASE}/advertorial`, () => {
    return HttpResponse.json([makePost({ id: 200 })])
  }),

  http.get(`${BASE}/announcement`, () => {
    return HttpResponse.json([makePost({ id: 300 })])
  }),

  http.get(`${BASE}/fact-of-the-day`, () => {
    return HttpResponse.json([makePost({ id: 400 })])
  }),

  // Videos
  http.get(`${BASE}/igh-yt-videos`, ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    if (search === 'empty') return HttpResponse.json([])
    return HttpResponse.json([makePost({ id: 500, slug: 'video-1' })])
  }),

  http.get(`${BASE}/igh-yt-videos/:id`, ({ params }) => {
    return HttpResponse.json(makePost({ id: Number(params.id) }))
  }),

  // Media
  http.get(`${BASE}/media/:id`, ({ params }) => {
    return HttpResponse.json({ id: Number(params.id), source_url: 'https://example.com/img.jpg' })
  }),

  // Comments
  http.get(`${BASE}/comments`, () => {
    return HttpResponse.json([{ id: 1, content: { rendered: 'Great post!' }, post: 1 }])
  }),

  http.post(`${BASE}/comments`, async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({ id: 99, ...body }, { status: 201 })
  }),

  // Advertisements
  http.get(`${BASE}/advertisement`, () => {
    return HttpResponse.json([
      makeAd({ id: 1, acf: { position: 'header', image: '', link: '' } }),
      makeAd({ id: 2, acf: { position: 'sidebar', image: '', link: '' } }),
    ])
  }),

  // Popular posts
  http.get(`${BASE}/popular-posts`, () => {
    return HttpResponse.json([makePost({ id: 600 })])
  }),

  // Traffic API
  http.get(TRAFFIC, () => {
    return HttpResponse.json([
      { id: 1, slug: 'popular-post', title: 'Popular', date: new Date().toISOString(), views: 1000 },
    ])
  }),

  // Health check
  http.get('https://new.igihe.com/wp-json/wp/v2/', () => {
    return HttpResponse.json({ name: 'Test Site' })
  }),
]

// Error scenario handlers (use in specific tests via server.use())
export const errorHandlers = {
  posts500: http.get(`${BASE}/posts`, () =>
    HttpResponse.json({ message: 'Server Error' }, { status: 500 })
  ),
  posts503: http.get(`${BASE}/posts`, () =>
    HttpResponse.json({ message: 'Service Unavailable' }, { status: 503 })
  ),
  categories404: http.get(`${BASE}/categories`, () =>
    HttpResponse.json({ message: 'Not Found' }, { status: 404 })
  ),
  networkError: http.get(`${BASE}/posts`, () =>
    HttpResponse.error()
  ),
}