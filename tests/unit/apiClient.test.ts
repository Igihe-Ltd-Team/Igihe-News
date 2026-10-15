import { server } from '../mocks/msw/server'
import { errorHandlers } from '../mocks/msw/handlers'
import { fetchWithTimeout, buildQuery, buildPaginationResponse, ApiError, API_CONFIG, resolveApiUrl } from '../../src/services/apiClient'
import { http, HttpResponse } from 'msw'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const BASE = 'https://new.igihe.com/english/wp-json/wp/v2'

describe('API_CONFIG', () => {
  it('reads baseURL from env', () => {
    expect(API_CONFIG.baseURL).toBe('https://new.igihe.com/english/wp-json/wp/v2')
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

describe('resolveApiUrl', () => {
  it('keeps WordPress URLs direct on the server', () => {
    expect(resolveApiUrl(`${BASE}/posts?page=1`)).toBe(`${BASE}/posts?page=1`)
  })

  it('routes browser WordPress GET requests through the same-origin proxy', () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
    Object.defineProperty(globalThis, 'window', { configurable: true, value: {} })

    try {
      expect(resolveApiUrl(`${BASE}/posts?page=1`)).toBe('/api/proxy/posts?page=1')
      expect(resolveApiUrl(`${BASE}/comments`, 'POST')).toBe(`${BASE}/comments`)
    } finally {
      if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
      else delete (globalThis as { window?: unknown }).window
    }
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
    expect(capturedHeaders['content-type']).toBeUndefined()
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

type ApiClientModule = typeof import('../../src/services/apiClient')

/** A private copy of the client, so each test gets its own circuit-breaker state. */
function freshClient(): ApiClientModule {
  let mod: ApiClientModule | undefined
  jest.isolateModules(() => {
    mod = require('../../src/services/apiClient')
  })
  return mod!
}

const realSetTimeout = setTimeout

/**
 * Runs `start` under fake timers and steps the clock until it settles.
 * Retries schedule their backoff timer only after the previous response
 * arrives, and the mock server answers in real time, so each step also yields
 * a few real milliseconds.
 */
async function settleWithFakeClock<T>(start: () => Promise<T>) {
  let outcome: { status: 'pending' } | { status: 'resolved'; value: T } | { status: 'rejected'; error: any } = { status: 'pending' }
  start().then(
    value => { outcome = { status: 'resolved', value } },
    error => { outcome = { status: 'rejected', error } }
  )
  for (let step = 0; step < 600 && outcome.status === 'pending'; step++) {
    await jest.advanceTimersByTimeAsync(500)
    await new Promise(resolve => realSetTimeout(resolve, 2))
  }
  return outcome
}

describe('fetchWithTimeout: definitive client errors', () => {
  it.each([400, 401, 403, 404, 410, 422])('does not retry a %i: the origin has given its final answer', async status => {
    let requests = 0
    server.use(
      http.get(`${BASE}/posts`, () => {
        requests++
        return HttpResponse.json({ message: 'no' }, { status })
      })
    )
    await expect(fetchWithTimeout(`${BASE}/posts`)).rejects.toMatchObject({ name: 'ApiError', statusCode: status, isRetryable: false })
    expect(requests).toBe(1)
  })

  it('does not wait on body.cancel(), which can stay pending forever', async () => {
    const neverSettles = new Promise<void>(() => {})
    const response = { ok: false, status: 404, body: { cancel: () => neverSettles } } as unknown as Response
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response)
    try {
      const outcome = await Promise.race([
        fetchWithTimeout(`${BASE}/posts`).then(() => 'resolved', error => error),
        new Promise<string>(resolve => realSetTimeout(() => resolve('hung'), 1000)),
      ])
      expect(outcome).not.toBe('hung')
      expect(outcome).toMatchObject({ statusCode: 404 })
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it('never opens the circuit breaker, however many 404s come in a row', async () => {
    const client = freshClient()
    server.use(
      http.get(`${BASE}/missing`, () => HttpResponse.json({ message: 'Not Found' }, { status: 404 })),
      http.get(`${BASE}/posts`, () => HttpResponse.json([]))
    )
    // The threshold is 5 consecutive failures; send twice that many 404s.
    for (let i = 0; i < 10; i++) {
      await expect(client.fetchWithTimeout(`${BASE}/missing`)).rejects.toMatchObject({ statusCode: 404 })
    }
    // A real request straight afterwards must not be refused as "circuit open".
    const res = await client.fetchWithTimeout(`${BASE}/posts`)
    expect(res.ok).toBe(true)
  })

  it('still retries 429 and 408, which are about timing and not final answers', async () => {
    const client = freshClient()
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] })
    try {
      for (const status of [429, 408]) {
        let requests = 0
        server.use(
          http.get(`${BASE}/posts`, () => (++requests === 1 ? HttpResponse.json({}, { status }) : HttpResponse.json([])))
        )
        const outcome = await settleWithFakeClock(() => client.fetchWithTimeout(`${BASE}/posts`))
        expect(outcome.status).toBe('resolved')
        expect(requests).toBe(2)
      }
    } finally {
      jest.useRealTimers()
    }
  })

  it('closes a half-open breaker when its trial request gets a 404, instead of leaving it stuck', async () => {
    const client = freshClient()
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] })
    try {
      // Five calls that exhaust their retries open the breaker.
      server.use(http.get(`${BASE}/posts`, () => HttpResponse.error()))
      for (let i = 0; i < 5; i++) {
        const outcome = await settleWithFakeClock(() => client.fetchWithTimeout(`${BASE}/posts`))
        expect(outcome.status).toBe('rejected')
      }
      await expect(client.fetchWithTimeout(`${BASE}/posts`)).rejects.toThrow(/circuit open/)

      // After the cooldown the next call is the trial. It gets a 404: WordPress is up.
      await jest.advanceTimersByTimeAsync(client.API_CONFIG.circuitCooldownMs + 1000)
      server.use(http.get(`${BASE}/posts`, () => HttpResponse.json({ message: 'Not Found' }, { status: 404 })))
      await expect(client.fetchWithTimeout(`${BASE}/posts`)).rejects.toMatchObject({ statusCode: 404 })

      // Closed again: the next call goes through rather than failing fast forever.
      server.use(http.get(`${BASE}/posts`, () => HttpResponse.json([])))
      const res = await client.fetchWithTimeout(`${BASE}/posts`)
      expect(res.ok).toBe(true)
    } finally {
      jest.useRealTimers()
    }
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
