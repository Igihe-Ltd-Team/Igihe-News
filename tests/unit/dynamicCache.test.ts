// Tests for the real dynamicCache implementation (not the mock)
// Point directly at the source to avoid the mock alias

jest.unmock('@/lib/cache/dynamicCache')

// Import from source path directly:
const { calculateArticleCacheTTL, calculateListCacheTTL } =
  jest.requireActual('../../src/lib/cache/dynamicCache') as typeof import('../../src/lib/cache/dynamicCache')

describe('calculateArticleCacheTTL', () => {
  const now = new Date()

  function minutesAgo(m: number) {
    return new Date(Date.now() - m * 60 * 1000).toISOString()
  }

  it('returns 2 minutes for articles < 1 hour old', () => {
    expect(calculateArticleCacheTTL(minutesAgo(30))).toBe(2 * 60 * 1000)
    expect(calculateArticleCacheTTL(minutesAgo(0))).toBe(2 * 60 * 1000)
    expect(calculateArticleCacheTTL(minutesAgo(59))).toBe(2 * 60 * 1000)
  })

  it('returns 5 minutes for articles 1-6 hours old', () => {
    expect(calculateArticleCacheTTL(minutesAgo(61))).toBe(5 * 60 * 1000)
    expect(calculateArticleCacheTTL(minutesAgo(300))).toBe(5 * 60 * 1000)
    expect(calculateArticleCacheTTL(minutesAgo(359))).toBe(5 * 60 * 1000)
  })

  it('returns 10 minutes for articles less than 24 hours old', () => {
    expect(calculateArticleCacheTTL(minutesAgo(361))).toBe(10 * 60 * 1000)
    expect(calculateArticleCacheTTL(minutesAgo(1000))).toBe(10 * 60 * 1000)
  })

  it('returns 30 minutes for articles 1-7 days old', () => {
    expect(calculateArticleCacheTTL(minutesAgo(1441))).toBe(30 * 60 * 1000)
    expect(calculateArticleCacheTTL(minutesAgo(60 * 24 * 5))).toBe(30 * 60 * 1000)
  })

  it('returns 24 hours for articles older than 7 days', () => {
    expect(calculateArticleCacheTTL(minutesAgo(60 * 24 * 8))).toBe(24 * 60 * 60 * 1000)
    expect(calculateArticleCacheTTL(minutesAgo(60 * 24 * 365))).toBe(24 * 60 * 60 * 1000)
  })

  it('accepts a Date object', () => {
    const d = new Date(Date.now() - 30 * 60 * 1000)
    expect(calculateArticleCacheTTL(d)).toBe(2 * 60 * 1000)
  })
})

describe('calculateListCacheTTL', () => {
  it('returns 2 minutes for first page', () => {
    expect(calculateListCacheTTL(true)).toBe(2 * 60 * 1000)
  })

  it('returns 5 minutes for subsequent pages', () => {
    expect(calculateListCacheTTL(false)).toBe(5 * 60 * 1000)
  })

  it('defaults to subsequent page behaviour', () => {
    expect(calculateListCacheTTL()).toBe(5 * 60 * 1000)
  })
})