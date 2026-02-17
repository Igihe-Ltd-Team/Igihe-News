// import { fileCache } from '@/lib/cache/fileCache'
// import { calculateArticleCacheTTL, calculateListCacheTTL } from '@/lib/cache/dynamicCache'
// import { NewsItem } from '@/types/fetchData'

// // ─── Configuration ───────────────────────────────────────────────────────────

// export const CACHE_CONFIG = {
//   defaultTTL: 5 * 60 * 1000,       // 5 minutes
//   maxMemoryCacheSize: 100,
//   rateLimitMax: 100,
//   rateLimitWindowMs: 60_000,
// } as const

// // ─── LRU Cache ───────────────────────────────────────────────────────────────

// export class LRUCache<T> {
//   private cache = new Map<string, { data: T; timestamp: number }>()
//   private readonly maxSize: number

//   constructor(maxSize: number = 100) {
//     this.maxSize = maxSize
//   }

//   get(key: string): { data: T; timestamp: number } | undefined {
//     const item = this.cache.get(key)
//     if (item) {
//       this.cache.delete(key)
//       this.cache.set(key, item)
//     }
//     return item
//   }

//   set(key: string, value: { data: T; timestamp: number }): void {
//     if (this.cache.has(key)) {
//       this.cache.delete(key)
//     }
//     if (this.cache.size >= this.maxSize) {
//       const firstKey = this.cache.keys().next().value
//       if (firstKey) this.cache.delete(firstKey)
//     }
//     this.cache.set(key, value)
//   }

//   has(key: string): boolean {
//     return this.cache.has(key)
//   }

//   delete(key: string): boolean {
//     return this.cache.delete(key)
//   }

//   clear(): void {
//     this.cache.clear()
//   }

//   size(): number {
//     return this.cache.size
//   }

//   keys(): string[] {
//     return Array.from(this.cache.keys())
//   }
// }

// // ─── Singletons ──────────────────────────────────────────────────────────────

// export const memoryCache = new LRUCache<any>(CACHE_CONFIG.maxMemoryCacheSize)
// export const pendingRequests = new Map<string, Promise<any>>()

// // ─── Rate Limiter ────────────────────────────────────────────────────────────

// const rateLimitBuckets = new Map<string, number[]>()

// export function checkRateLimit(
//   key: string = 'api_requests',
//   maxRequests: number = CACHE_CONFIG.rateLimitMax,
//   windowMs: number = CACHE_CONFIG.rateLimitWindowMs
// ): void {
//   const now = Date.now()
//   const requests = rateLimitBuckets.get(key) || []
//   const recent = requests.filter(t => t > now - windowMs)

//   if (recent.length >= maxRequests) {
//     throw new Error('Rate limit exceeded')
//   }

//   recent.push(now)
//   rateLimitBuckets.set(key, recent)
// }

// // ─── Helpers ─────────────────────────────────────────────────────────────────

// const isServer = () => typeof window === 'undefined'

// // ─── Unified Cache Strategy ──────────────────────────────────────────────────
// //
// // This replaces the three overlapping methods:
// //   - cachedFetch          (simple TTL)
// //   - dedupedFetch         (dedup + TTL)
// //   - cachedFetchWithDynamicTTL  (dynamic TTL + stale-while-revalidate)
// //
// // All callers now use `cachedRequest()` with an options bag.

// export interface CacheRequestOptions<T> {
//   /** Unique cache key */
//   key: string
//   /** The actual fetch function */
//   fetchFn: () => Promise<T>
//   /** Base TTL in ms (default: 5 min) */
//   ttl?: number
//   /**
//    * Optional: extract a content date from the result so the TTL can be
//    * calculated dynamically via `calculateArticleCacheTTL`.
//    * When provided, enables stale-while-revalidate behaviour.
//    */
//   getContentDate?: (data: T) => string | Date | null
//   /**
//    * When true (default), in-flight requests are deduped so the same key
//    * is never fetched twice concurrently.
//    */
//   dedup?: boolean
// }

// export async function cachedRequest<T>(opts: CacheRequestOptions<T>): Promise<T> {
//   const {
//     key,
//     fetchFn,
//     ttl = CACHE_CONFIG.defaultTTL,
//     getContentDate,
//     dedup = true,
//   } = opts

//   const now = Date.now()
//   const useDynamicTTL = !!getContentDate

//   // ── 1. Memory cache ────────────────────────────────────────────────────
//   const memoryCached = memoryCache.get(key)

//   if (memoryCached) {
//     const cacheAge = now - memoryCached.timestamp

//     // Calculate effective TTL
//     let effectiveTTL = ttl
//     if (useDynamicTTL) {
//       const contentDate = getContentDate!(memoryCached.data)
//       if (contentDate) effectiveTTL = calculateArticleCacheTTL(contentDate)
//     }

//     // Fresh → return immediately
//     if (cacheAge < effectiveTTL) {
//       return memoryCached.data
//     }

//     // Stale but acceptable (< 10× TTL) → return stale + revalidate in bg
//     if (useDynamicTTL && cacheAge < effectiveTTL * 10) {
//       if (!pendingRequests.has(key)) {
//         revalidateInBackground(key, fetchFn, getContentDate, effectiveTTL).catch(() => {})
//       }
//       return memoryCached.data
//     }
//     // Otherwise fall through to fetch fresh
//   }

//   // ── 2. File cache (server only) ────────────────────────────────────────
//   if (isServer()) {
//     const fileCached = await fileCache.get<T>(key)
//     if (fileCached !== null) {
//       memoryCache.set(key, { data: fileCached, timestamp: now })

//       // Trigger background revalidation from file cache too
//       if (useDynamicTTL && !pendingRequests.has(key)) {
//         revalidateInBackground(key, fetchFn, getContentDate, ttl).catch(() => {})
//       }

//       return fileCached
//     }
//   }

//   // ── 3. Dedup in-flight requests ────────────────────────────────────────
//   if (dedup && pendingRequests.has(key)) {
//     return pendingRequests.get(key)!
//   }

//   // ── 4. Fetch fresh data ────────────────────────────────────────────────
//   return fetchAndCache(key, fetchFn, getContentDate, ttl)
// }

// // ─── Internal helpers ────────────────────────────────────────────────────────

// async function fetchAndCache<T>(
//   key: string,
//   fetchFn: () => Promise<T>,
//   getContentDate?: (data: T) => string | Date | null,
//   baseTTL: number = CACHE_CONFIG.defaultTTL
// ): Promise<T> {
//   const now = Date.now()
//   checkRateLimit()

//   try {
//     const promise = fetchFn()
//     pendingRequests.set(key, promise)
//     const data = await promise

//     // Dynamic TTL
//     let finalTTL = baseTTL
//     if (getContentDate) {
//       const contentDate = getContentDate(data)
//       if (contentDate) finalTTL = calculateArticleCacheTTL(contentDate)
//     }

//     memoryCache.set(key, { data, timestamp: now })

//     if (isServer()) {
//       await fileCache.set(key, data, finalTTL)
//     }

//     return data
//   } catch (error) {
//     // Stale-while-error: return whatever we have
//     const staleMemory = memoryCache.get(key)
//     if (staleMemory) {
//       console.warn('⚠️ Using stale memory cache due to error')
//       return staleMemory.data
//     }

//     if (isServer()) {
//       const staleFile = await fileCache.get<T>(key)
//       if (staleFile !== null) {
//         console.warn('⚠️ Using stale file cache due to error')
//         return staleFile
//       }
//     }

//     throw error
//   } finally {
//     pendingRequests.delete(key)
//   }
// }

// async function revalidateInBackground<T>(
//   key: string,
//   fetchFn: () => Promise<T>,
//   getContentDate?: (data: T) => string | Date | null,
//   ttl: number = CACHE_CONFIG.defaultTTL
// ): Promise<void> {
//   try {
//     await fetchAndCache(key, fetchFn, getContentDate, ttl)
//   } catch {
//     // Non-blocking — we already served stale data
//   }
// }

// // ─── Article-specific cache helpers ──────────────────────────────────────────

// export function cacheArticleInMemory(article: NewsItem): void {
//   if (!article?.slug) return
//   const key = `post:${article.slug}`
//   if (pendingRequests.has(key)) return
//   memoryCache.set(key, { data: article, timestamp: Date.now() })
// }

// export async function cacheArticlesFromList(articles: NewsItem[]): Promise<void> {
//   if (!articles?.length) return

//   const now = Date.now()
//   const batchSize = 5

//   for (let i = 0; i < articles.length; i += batchSize) {
//     const batch = articles.slice(i, i + batchSize)
//     await Promise.all(
//       batch.map(async (article) => {
//         if (!article?.slug) return
//         const key = `post:${article.slug}`
//         if (pendingRequests.has(key)) return

//         const ttl = article.date
//           ? calculateArticleCacheTTL(article.date)
//           : CACHE_CONFIG.defaultTTL

//         memoryCache.set(key, { data: article, timestamp: now })

//         if (isServer()) {
//           try {
//             await fileCache.set(key, article, ttl, { contentDate: article.date })
//           } catch {
//             // Silently continue
//           }
//         }
//       })
//     )
//   }
// }

// // ─── Cache management ────────────────────────────────────────────────────────

// export async function clearCache(pattern?: string): Promise<void> {
//   if (pattern) {
//     memoryCache.keys()
//       .filter(k => k.includes(pattern))
//       .forEach(k => memoryCache.delete(k))
//   } else {
//     memoryCache.clear()
//   }

//   if (isServer()) {
//     await fileCache.clear(pattern)
//   }
// }

// export async function cleanExpiredCache(): Promise<void> {
//   if (isServer()) {
//     await fileCache.cleanExpired()
//   }
// }

// export async function getCacheStats() {
//   if (isServer()) {
//     return fileCache.getStats()
//   }
//   return { count: 0, size: 0 }
// }

// export function getCachedArticle(key: string): NewsItem | null {
//   const cached = memoryCache.get(key)
//   return cached ? cached.data : null
// }

// export { calculateArticleCacheTTL, calculateListCacheTTL }




// lib/api/cacheManager.ts  (PATCHED — key changes marked with ★)
//
// WHAT CHANGED vs the original:
//  ★ stale-while-revalidate window cut from 10× TTL → 1.5× TTL
//    This means a list cache that's 3 minutes old (TTL=2 min) will show
//    stale data for at most 3 minutes total instead of 20.
//  ★ clearCache() now also clears pendingRequests for the matching keys
//    so a force-clear from the webhook actually takes effect immediately.
//  ★ The file cache is cleared synchronously before the memory cache so
//    the next request always hits the network.

import { fileCache } from '@/lib/cache/fileCache'
import { calculateArticleCacheTTL, calculateListCacheTTL } from '@/lib/cache/dynamicCache'
import { NewsItem } from '@/types/fetchData'

// ─── Configuration ───────────────────────────────────────────────────────────

export const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000,
  maxMemoryCacheSize: 100,
  rateLimitMax: 100,
  rateLimitWindowMs: 60_000,
  // ★ How many times beyond TTL we'll serve stale data while revalidating.
  //   Was implicitly 10× in the original; now 1.5× so new articles appear fast.
  staleMultiplier: 1.5,
} as const

// ─── LRU Cache ───────────────────────────────────────────────────────────────

export class LRUCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>()
  private readonly maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get(key: string): { data: T; timestamp: number } | undefined {
    const item = this.cache.get(key)
    if (item) {
      this.cache.delete(key)
      this.cache.set(key, item)
    }
    return item
  }

  set(key: string, value: { data: T; timestamp: number }): void {
    if (this.cache.has(key)) this.cache.delete(key)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  has(key: string): boolean { return this.cache.has(key) }
  delete(key: string): boolean { return this.cache.delete(key) }
  clear(): void { this.cache.clear() }
  size(): number { return this.cache.size }
  keys(): string[] { return Array.from(this.cache.keys()) }
}

// ─── Singletons ──────────────────────────────────────────────────────────────

export const memoryCache = new LRUCache<any>(CACHE_CONFIG.maxMemoryCacheSize)
export const pendingRequests = new Map<string, Promise<any>>()

// ─── Rate Limiter ────────────────────────────────────────────────────────────

const rateLimitBuckets = new Map<string, number[]>()

export function checkRateLimit(
  key: string = 'api_requests',
  maxRequests: number = CACHE_CONFIG.rateLimitMax,
  windowMs: number = CACHE_CONFIG.rateLimitWindowMs
): void {
  const now = Date.now()
  const requests = rateLimitBuckets.get(key) || []
  const recent = requests.filter(t => t > now - windowMs)
  if (recent.length >= maxRequests) throw new Error('Rate limit exceeded')
  recent.push(now)
  rateLimitBuckets.set(key, recent)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isServer = () => typeof window === 'undefined'

// ─── Unified Cache Strategy ──────────────────────────────────────────────────

export interface CacheRequestOptions<T> {
  key: string
  fetchFn: () => Promise<T>
  ttl?: number
  getContentDate?: (data: T) => string | Date | null
  dedup?: boolean
}

export async function cachedRequest<T>(opts: CacheRequestOptions<T>): Promise<T> {
  const {
    key,
    fetchFn,
    ttl = CACHE_CONFIG.defaultTTL,
    getContentDate,
    dedup = true,
  } = opts

  const now = Date.now()
  const useDynamicTTL = !!getContentDate

  // ── 1. Memory cache ────────────────────────────────────────────────────────
  const memoryCached = memoryCache.get(key)

  if (memoryCached) {
    const cacheAge = now - memoryCached.timestamp

    let effectiveTTL = ttl
    if (useDynamicTTL) {
      const contentDate = getContentDate!(memoryCached.data)
      if (contentDate) effectiveTTL = calculateArticleCacheTTL(contentDate)
    }

    // Fresh → return immediately
    if (cacheAge < effectiveTTL) return memoryCached.data

    // ★ Stale window is now 1.5× TTL instead of 10×
    //   e.g. a 2-min TTL list will only serve stale for 3 min total
    const staleWindow = effectiveTTL * CACHE_CONFIG.staleMultiplier
    if (useDynamicTTL && cacheAge < staleWindow) {
      if (!pendingRequests.has(key)) {
        revalidateInBackground(key, fetchFn, getContentDate, effectiveTTL).catch(() => {})
      }
      return memoryCached.data
    }
    // Otherwise fall through to fetch fresh
  }

  // ── 2. File cache (server only) ────────────────────────────────────────────
  if (isServer()) {
    const fileCached = await fileCache.get<T>(key)
    if (fileCached !== null) {
      memoryCache.set(key, { data: fileCached, timestamp: now })
      if (useDynamicTTL && !pendingRequests.has(key)) {
        revalidateInBackground(key, fetchFn, getContentDate, ttl).catch(() => {})
      }
      return fileCached
    }
  }

  // ── 3. Dedup in-flight requests ────────────────────────────────────────────
  if (dedup && pendingRequests.has(key)) return pendingRequests.get(key)!

  // ── 4. Fetch fresh ─────────────────────────────────────────────────────────
  return fetchAndCache(key, fetchFn, getContentDate, ttl)
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function fetchAndCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  getContentDate?: (data: T) => string | Date | null,
  baseTTL: number = CACHE_CONFIG.defaultTTL
): Promise<T> {
  const now = Date.now()
  checkRateLimit()

  try {
    const promise = fetchFn()
    pendingRequests.set(key, promise)
    const data = await promise

    let finalTTL = baseTTL
    if (getContentDate) {
      const contentDate = getContentDate(data)
      if (contentDate) finalTTL = calculateArticleCacheTTL(contentDate)
    }

    memoryCache.set(key, { data, timestamp: now })
    if (isServer()) await fileCache.set(key, data, finalTTL)

    return data
  } catch (error) {
    const staleMemory = memoryCache.get(key)
    if (staleMemory) {
      console.warn('⚠️ Using stale memory cache due to error')
      return staleMemory.data
    }
    if (isServer()) {
      const staleFile = await fileCache.get<T>(key)
      if (staleFile !== null) {
        console.warn('⚠️ Using stale file cache due to error')
        return staleFile
      }
    }
    throw error
  } finally {
    pendingRequests.delete(key)
  }
}

async function revalidateInBackground<T>(
  key: string,
  fetchFn: () => Promise<T>,
  getContentDate?: (data: T) => string | Date | null,
  ttl: number = CACHE_CONFIG.defaultTTL
): Promise<void> {
  try {
    await fetchAndCache(key, fetchFn, getContentDate, ttl)
  } catch {
    // Non-blocking
  }
}

// ─── Article-specific cache helpers ──────────────────────────────────────────

export function cacheArticleInMemory(article: NewsItem): void {
  if (!article?.slug) return
  const key = `post:${article.slug}`
  if (pendingRequests.has(key)) return
  memoryCache.set(key, { data: article, timestamp: Date.now() })
}

export async function cacheArticlesFromList(articles: NewsItem[]): Promise<void> {
  if (!articles?.length) return
  const now = Date.now()
  const batchSize = 5

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)
    await Promise.all(
      batch.map(async (article) => {
        if (!article?.slug) return
        const key = `post:${article.slug}`
        if (pendingRequests.has(key)) return
        const ttl = article.date ? calculateArticleCacheTTL(article.date) : CACHE_CONFIG.defaultTTL
        memoryCache.set(key, { data: article, timestamp: now })
        if (isServer()) {
          try {
            await fileCache.set(key, article, ttl, { contentDate: article.date })
          } catch { /* silent */ }
        }
      })
    )
  }
}

// ─── Cache management ★ ──────────────────────────────────────────────────────
// ★ clearCache now also removes matching pendingRequests entries so a webhook
//   purge takes full effect immediately instead of returning the in-flight result.

export async function clearCache(pattern?: string): Promise<void> {
  if (pattern) {
    const matchingKeys = memoryCache.keys().filter(k => k.includes(pattern))
    matchingKeys.forEach(k => {
      memoryCache.delete(k)
      pendingRequests.delete(k) // ★ cancel in-flight for this key
    })
  } else {
    // Full clear
    memoryCache.keys().forEach(k => pendingRequests.delete(k))
    memoryCache.clear()
  }

  // ★ File cache is cleared BEFORE the function returns so the next
  //   server-side request always hits the network.
  if (isServer()) {
    await fileCache.clear(pattern)
  }
}

export async function cleanExpiredCache(): Promise<void> {
  if (isServer()) await fileCache.cleanExpired()
}

export async function getCacheStats() {
  if (isServer()) return fileCache.getStats()
  return { count: 0, size: 0 }
}

export function getCachedArticle(key: string): NewsItem | null {
  const cached = memoryCache.get(key)
  return cached ? cached.data : null
}

export { calculateArticleCacheTTL, calculateListCacheTTL }