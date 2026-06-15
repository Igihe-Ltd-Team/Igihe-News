interface RateLimitOptions {
  limit: number
  windowMs: number
  maxBuckets?: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

interface Bucket {
  count: number
  resetAt: number
}

export class LocalRateLimiter {
  private readonly buckets = new Map<string, Bucket>()
  private readonly maxBuckets: number

  constructor(private readonly options: RateLimitOptions) {
    this.maxBuckets = options.maxBuckets ?? 10_000
  }

  check(key: string, now = Date.now()): RateLimitResult {
    this.prune(now)

    const existing = this.buckets.get(key)
    const bucket = !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + this.options.windowMs }
      : existing

    bucket.count += 1
    this.buckets.delete(key)
    this.buckets.set(key, bucket)

    const allowed = bucket.count <= this.options.limit
    return {
      allowed,
      remaining: Math.max(0, this.options.limit - bucket.count),
      retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }

  clear(): void {
    this.buckets.clear()
  }

  size(): number {
    return this.buckets.size
  }

  private prune(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key)
    }

    while (this.buckets.size >= this.maxBuckets) {
      const oldestKey = this.buckets.keys().next().value
      if (!oldestKey) break
      this.buckets.delete(oldestKey)
    }
  }
}
