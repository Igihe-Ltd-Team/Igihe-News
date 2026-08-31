import { Category } from '@/types/fetchData'

// Wraps any promise with a timeout
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ])
}

// Build a category ID→slug map once, reuse everywhere
export async function buildCategoryMap(): Promise<Map<number, string>> {
  try {
    const { prefetchAllHomeData } = await import('@/lib/prefetch-home-data')
    const data = await prefetchAllHomeData()
    const categories: Category[] = data.categories || []
    return new Map(categories.map(c => [c.id, c.slug]))
  } catch {
    return new Map()
  }
}
