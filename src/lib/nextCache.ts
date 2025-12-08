import { unstable_cache } from 'next/cache'
import { cache } from 'react'

// For server components - shared cache across requests
export const getServerCache = unstable_cache(
  async (key: string, fetchFn: () => Promise<any>) => {
    console.log('Cache miss for:', key)
    return fetchFn()
  },
  ['server-cache'],
  {
    revalidate: 300, // 5 minutes
    tags: ['api-data']
  }
)

// For React component tree deduplication
export const getReactCache = cache(async (key: string, fetchFn: () => Promise<any>) => {
  // React automatically deduplicates same calls during render
  return fetchFn()
})