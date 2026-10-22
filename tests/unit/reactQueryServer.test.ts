/**
 * @jest-environment node
 */
import { getQueryClient } from '@/lib/react-query'

describe('the server-side QueryClient', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('starts no garbage-collection timer for a query (they pinned every rendered page in memory)', () => {
    const client = getQueryClient()
    const cache = client.getQueryCache()
    for (let i = 0; i < 50; i++) cache.build(client, { queryKey: ['page', i], queryFn: async () => i })
    expect(cache.getAll()).toHaveLength(50)
    expect(jest.getTimerCount()).toBe(0)
  })

  it('does not retry a failed query on the server', () => {
    const retry = getQueryClient().getDefaultOptions().queries?.retry as (count: number, error: Error) => boolean
    expect(retry(0, new Error('500'))).toBe(false)
  })
})

describe('gcTimeFor', () => {
  it('is "never" on the server, whatever the browser time is', () => {
    const { gcTimeFor } = jest.requireActual('@/lib/react-query') as typeof import('@/lib/react-query')
    expect(gcTimeFor(30 * 60 * 1000)).toBe(Infinity)
  })
})
