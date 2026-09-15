import { server } from '../mocks/msw/server'
import { http, HttpResponse } from 'msw'
import { memoryCache, pendingRequests } from '../../src/services/cacheManager'
import { fetchArticles } from '../../src/services/articleService'

const BASE = 'https://new.igihe.com/english/wp-json/wp/v2'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  memoryCache.clear()
  pendingRequests.clear()
})
afterAll(() => server.close())

describe('fetchArticles byline filter', () => {
  it('sends one byline id as-is', async () => {
    let captured = ''
    server.use(http.get(`${BASE}/posts`, ({ request }) => {
      captured = request.url
      return HttpResponse.json([], { headers: { 'X-WP-Total': '0', 'X-WP-TotalPages': '0' } })
    }))
    await fetchArticles({ bylines: 2474 })
    expect(new URL(captured).searchParams.get('byline')).toBe('2474')
  })

  it('sends merged author aliases as a comma-separated list (WordPress ORs them)', async () => {
    let captured = ''
    server.use(http.get(`${BASE}/posts`, ({ request }) => {
      captured = request.url
      return HttpResponse.json([], { headers: { 'X-WP-Total': '0', 'X-WP-TotalPages': '0' } })
    }))
    await fetchArticles({ bylines: [2474, 610, 611] })
    expect(new URL(captured).searchParams.get('byline')).toBe('2474,610,611')
  })
})
