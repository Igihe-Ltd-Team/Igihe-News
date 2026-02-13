export const calculateArticleCacheTTL = jest.fn((date: string | Date): number => {
  const age = Date.now() - new Date(date).getTime()
  const minutes = age / 60000
  if (minutes < 60) return 2 * 60 * 1000
  if (minutes < 360) return 5 * 60 * 1000
  if (minutes < 1440) return 10 * 60 * 1000
  if (minutes < 10080) return 30 * 60 * 1000
  return 24 * 60 * 60 * 1000
})

export const calculateListCacheTTL = jest.fn((isFirstPage = false): number => {
  return isFirstPage ? 2 * 60 * 1000 : 5 * 60 * 1000
})