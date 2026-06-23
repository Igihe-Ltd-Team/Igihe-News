interface CacheEntry {
  data: any
  expiry: number
  etag?: string
  _headers?: {
    wpTotal?: number | string | null
    wpTotalPages?: number | string | null
    link?: string | null
  }
}

export class ProxyLRUCache {
  private cache = new Map<string, CacheEntry>()
  private readonly maxSize: number

  constructor(maxSize = 200) {
    this.maxSize = maxSize
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry
  }

  set(key: string, value: CacheEntry): void {
    if (this.cache.has(key)) this.cache.delete(key)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  clear(): void {
    this.cache.clear()
  }

  clearByPattern(pattern: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) this.cache.delete(key)
    }
  }
}

export const proxyCache = new ProxyLRUCache(200)
