import { LocalRateLimiter } from '@/lib/rateLimit'

describe('LocalRateLimiter', () => {
  it('limits requests within a fixed window', () => {
    const limiter = new LocalRateLimiter({ limit: 2, windowMs: 1_000 })

    expect(limiter.check('client', 0).allowed).toBe(true)
    expect(limiter.check('client', 1).allowed).toBe(true)
    expect(limiter.check('client', 2).allowed).toBe(false)
  })

  it('resets an expired bucket', () => {
    const limiter = new LocalRateLimiter({ limit: 1, windowMs: 1_000 })

    expect(limiter.check('client', 0).allowed).toBe(true)
    expect(limiter.check('client', 1).allowed).toBe(false)
    expect(limiter.check('client', 1_001).allowed).toBe(true)
  })

  it('bounds the number of tracked clients', () => {
    const limiter = new LocalRateLimiter({ limit: 1, windowMs: 60_000, maxBuckets: 2 })

    limiter.check('one', 0)
    limiter.check('two', 0)
    limiter.check('three', 0)

    expect(limiter.size()).toBe(2)
  })
})
