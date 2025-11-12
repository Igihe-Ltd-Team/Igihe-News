import { QueryClient } from '@tanstack/react-query'

/**
 * Performance monitoring utilities for high-traffic applications
 */

export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  /**
   * Track query performance
   */
  static trackQuery(queryKey: string, duration: number) {
    if (!this.metrics.has(queryKey)) {
      this.metrics.set(queryKey, [])
    }
    this.metrics.get(queryKey)!.push(duration)
  }

  /**
   * Get average query time
   */
  static getAverageTime(queryKey: string): number {
    const times = this.metrics.get(queryKey) || []
    if (times.length === 0) return 0
    return times.reduce((a, b) => a + b, 0) / times.length
  }

  /**
   * Get all metrics
   */
  static getAllMetrics() {
    const metrics: Record<string, { avg: number; count: number }> = {}
    this.metrics.forEach((times, key) => {
      metrics[key] = {
        avg: this.getAverageTime(key),
        count: times.length
      }
    })
    return metrics
  }

  /**
   * Clear metrics
   */
  static clear() {
    this.metrics.clear()
  }
}

/**
 * Prefetch strategy for related content
 */
export class PrefetchStrategy {
  constructor(private queryClient: QueryClient) {}

  /**
   * Prefetch on hover with debounce
   */
  prefetchOnHover(queryKey: unknown[], queryFn: () => Promise<unknown>, delay: number = 300) {
    let timeoutId: NodeJS.Timeout

    return {
      onMouseEnter: () => {
        timeoutId = setTimeout(() => {
          this.queryClient.prefetchQuery({
            queryKey,
            queryFn,
            staleTime: 5 * 60 * 1000
          })
        }, delay)
      },
      onMouseLeave: () => {
        clearTimeout(timeoutId)
      }
    }
  }

  /**
   * Prefetch visible items using Intersection Observer
   */
  prefetchOnVisible(
    element: HTMLElement,
    queryKey: unknown[],
    queryFn: () => Promise<unknown>
  ) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.queryClient.prefetchQuery({
              queryKey,
              queryFn,
              staleTime: 5 * 60 * 1000
            })
            observer.unobserve(element)
          }
        })
      },
      { rootMargin: '50px' }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }

  /**
   * Batch prefetch multiple queries
   */
  async batchPrefetch(
    queries: Array<{ queryKey: unknown[]; queryFn: () => Promise<unknown> }>
  ) {
    // Use Promise.allSettled to prevent one failure from stopping others
    await Promise.allSettled(
      queries.map(({ queryKey, queryFn }) =>
        this.queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: 5 * 60 * 1000
        })
      )
    )
  }
}

/**
 * Cache warming for high-traffic routes
 */
export class CacheWarmer {
  constructor(private queryClient: QueryClient) {}

  /**
   * Warm cache for common queries on app load
   */
  async warmCache(queries: Array<{
    queryKey: unknown[]
    queryFn: () => Promise<unknown>
    priority?: 'high' | 'low'
  }>) {
    // Separate high and low priority queries
    const highPriority = queries.filter(q => q.priority === 'high')
    const lowPriority = queries.filter(q => q.priority !== 'high')

    // Execute high priority immediately
    if (highPriority.length > 0) {
      await Promise.allSettled(
        highPriority.map(({ queryKey, queryFn }) =>
          this.queryClient.prefetchQuery({ queryKey, queryFn })
        )
      )
    }

    // Execute low priority in idle time
    if (lowPriority.length > 0 && 'requestIdleCallback' in window) {
      requestIdleCallback(() => {
        Promise.allSettled(
          lowPriority.map(({ queryKey, queryFn }) =>
            this.queryClient.prefetchQuery({ queryKey, queryFn })
          )
        )
      })
    }
  }

  /**
   * Check cache health
   */
  getCacheHealth() {
    const cache = this.queryClient.getQueryCache()
    const queries = cache.getAll()
    
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      invalidQueries: queries.filter(q => q.state.status === 'error').length
    }
  }

  /**
   * Aggressive cache cleanup for memory management
   */
  aggressiveCleanup() {
    const cache = this.queryClient.getQueryCache()
    const queries = cache.getAll()
    
    // Remove stale queries with no observers
    queries.forEach(query => {
      if (query.isStale() && query.getObserversCount() === 0) {
        cache.remove(query)
      }
    })
  }
}

/**
 * Session-based prefetch tracker
 */
export class PrefetchTracker {
  private static STORAGE_KEY = 'news_prefetch_session'
  
  /**
   * Check if we've prefetched in this session
   */
  static hasPrefetched(): boolean {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(this.STORAGE_KEY) === 'true'
  }

  /**
   * Mark as prefetched
   */
  static markPrefetched() {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(this.STORAGE_KEY, 'true')
  }

  /**
   * Clear prefetch marker
   */
  static clear() {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(this.STORAGE_KEY)
  }
}