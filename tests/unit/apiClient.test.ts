import { server } from '../mocks/msw/server'
import { errorHandlers } from '../mocks/msw/handlers'
import { fetchWithTimeout, buildQuery, buildPaginationResponse, ApiError, API_CONFIG } from '../../src/services/apiClient'
import { http, HttpResponse } from 'msw'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const BASE = 'https://new.igihe.com/wp-json/wp/v2'

describe('API_CONFIG', () => {
  it('reads baseURL from env', () => {
    expect(API_CONFIG.baseURL).toBe('https://new.igihe.com/wp-json/wp/v2')
  })

  it('has timeout of 20 seconds', () => {
    expect(API_CONFIG.timeout).toBe(20_000)
  })

  it('has 3 retry attempts', () => {
    expect(API_CONFIG.retryAttempts).toBe(3)
  })
})

describe('ApiError', () => {
  it('sets name to ApiError', () => {
    const err = new ApiError('test', 404)
    expect(err.name).toBe('ApiError')
    expect(err.statusCode).toBe(404)
    expect(err.isRetryable).toBe(false)
  })

  it('supports isRetryable flag', () => {
    const err = new ApiError('timeout', 408, true)
    expect(err.isRetryable).toBe(true)
  })
})

describe('fetchWithTimeout', () => {
  it('fetches and returns a Response on success', async () => {
    const res = await fetchWithTimeout(`${BASE}/posts`)
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('retries on 500 and eventually throws ApiError', async () => {
    server.use(errorHandlers.posts500)
    await expect(fetchWithTimeout(`${BASE}/posts`)).rejects.toThrow(ApiError)
  }, 15000)

  it('retries on 503', async () => {
    server.use(errorHandlers.posts503)
    await expect(fetchWithTimeout(`${BASE}/posts`)).rejects.toThrow()
  }, 15000)

  it('throws ApiError on non-retryable 404', async () => {
    server.use(
      http.get(`${BASE}/posts`, () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 })
      )
    )
    await expect(fetchWithTimeout(`${BASE}/posts`)).rejects.toThrow(ApiError)
  })

  it('sets correct headers for GET requests', async () => {
    let capturedHeaders: Record<string, string> = {}
    server.use(
      http.get(`${BASE}/posts`, ({ request }) => {
        capturedHeaders = Object.fromEntries(request.headers)
        return HttpResponse.json([])
      })
    )
    await fetchWithTimeout(`${BASE}/posts`)
    expect(capturedHeaders['accept']).toBe('application/json')
  })

  it('sets Content-Type for POST requests', async () => {
    let capturedHeaders: Record<string, string> = {}
    server.use(
      http.post(`${BASE}/comments`, ({ request }) => {
        capturedHeaders = Object.fromEntries(request.headers)
        return HttpResponse.json({}, { status: 201 })
      })
    )
    await fetchWithTimeout(`${BASE}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content: 'test' }),
    })
    expect(capturedHeaders['content-type']).toContain('application/json')
  })

  it('aborts on timeout', async () => {
    server.use(
      http.get(`${BASE}/posts`, async () => {
        await new Promise(res => setTimeout(res, 200))
        return HttpResponse.json([])
      })
    )
    await expect(fetchWithTimeout(`${BASE}/posts`, {}, 50)).rejects.toThrow()
  })
})

describe('buildQuery', () => {
  it('builds a query string from params', () => {
    const qs = buildQuery({ page: 1, per_page: 20, search: 'hello' })
    expect(qs).toContain('page=1')
    expect(qs).toContain('per_page=20')
    expect(qs).toContain('search=hello')
  })

  it('omits undefined, null, and empty string values', () => {
    const qs = buildQuery({ page: 1, search: undefined, filter: null, tag: '' })
    expect(qs).not.toContain('search')
    expect(qs).not.toContain('filter')
    expect(qs).not.toContain('tag')
    expect(qs).toContain('page=1')
  })

  it('handles array values', () => {
    const qs = buildQuery({ categories: [1, 2, 3] })
    // URLSearchParams appends each value separately
    expect(qs).toContain('categories=1')
    expect(qs).toContain('categories=2')
    expect(qs).toContain('categories=3')
  })

  it('returns empty string for empty params', () => {
    expect(buildQuery({})).toBe('')
  })
})

describe('buildPaginationResponse', () => {
  function makeResponse(total: string, totalPages: string) {
    return new Response(null, {
      headers: {
        'X-WP-Total': total,
        'X-WP-TotalPages': totalPages,
      },
    })
  }

  it('builds correct pagination object', () => {
    const data = [{ id: 1 }, { id: 2 }]
    const response = makeResponse('42', '5')
    const result = buildPaginationResponse(data, response, { page: 2, per_page: 10 })

    expect(result.data).toEqual(data)
    expect(result.pagination.currentPage).toBe(2)
    expect(result.pagination.perPage).toBe(10)
    expect(result.pagination.totalPages).toBe(5)
    expect(result.pagination.totalItems).toBe(42)
    expect(result.pagination.hasNextPage).toBe(true)
  })

  it('hasNextPage is false on last page', () => {
    const result = buildPaginationResponse([], makeResponse('10', '2'), { page: 2, per_page: 5 })
    expect(result.pagination.hasNextPage).toBe(false)
  })

  it('defaults page to 1 and per_page to 10', () => {
    const result = buildPaginationResponse([], makeResponse('0', '1'), {})
    expect(result.pagination.currentPage).toBe(1)
    expect(result.pagination.perPage).toBe(10)
  })
})