// lib/cache/fileCache.ts
import type { promises as fsPromises } from 'fs'
import type { join as pathJoin } from 'path'

const CACHE_DIR = '.cache'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  metadata?: {
    contentDate?: string
    isPermanent?: boolean
  }
}

const getCwd = (): string => {
  try {
    const proc = (globalThis as any).process
    return proc && typeof proc.cwd === 'function' ? proc.cwd() : ''
  } catch {
    return ''
  }
}

export class FileCache {
  private fs: typeof fsPromises | null = null
  private path: { join: typeof pathJoin } | null = null

  constructor() {
    if (typeof window === 'undefined') {
      try {
        this.fs = require('fs').promises
        this.path = require('path')
      } catch {
        // Not available (Edge runtime)
      }
    }
  }

  private async ensureCacheDir(): Promise<string | null> {
    if (!this.fs || !this.path) return null
    const cwd = getCwd()
    if (!cwd) return null
    const cacheDir = this.path.join(cwd, CACHE_DIR)
    await this.fs.mkdir(cacheDir, { recursive: true })
    return cacheDir
  }

  private getCacheFilePath(key: string): string {
    if (!this.path || typeof window !== 'undefined') return ''
    const cwd = getCwd()
    if (!cwd) return ''
    const sanitizedKey = key.replace(/[^a-z0-9-_:]/gi, '_').substring(0, 200)
    return this.path.join(cwd, CACHE_DIR, `${sanitizedKey}.json`)
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.fs || typeof window !== 'undefined') return null
    try {
      const filePath = this.getCacheFilePath(key)
      if (!filePath) return null
      const fileContent = await this.fs.readFile(filePath, 'utf-8')
      const entry: CacheEntry<T> = JSON.parse(fileContent)
      const now = Date.now()

      if (entry.metadata?.isPermanent) {
        console.log(`✅ File cache HIT (PERMANENT): ${key}`)
        return entry.data
      }

      if (now > entry.expiresAt) {
        await this.delete(key)
        console.log(`⏰ Cache expired: ${key}`)
        return null
      }

      const remainingMin = Math.round((entry.expiresAt - now) / 1000 / 60)
      console.log(`✅ File cache HIT: ${key} (${remainingMin} min remaining)`)
      return entry.data
    } catch {
      return null
    }
  }

  async set<T>(key: string, data: T, ttl: number, metadata?: { contentDate?: string }): Promise<void> {
    if (!this.fs || typeof window !== 'undefined') return
    try {
      await this.ensureCacheDir()
      const filePath = this.getCacheFilePath(key)
      if (!filePath) return

      const now = Date.now()
      const ONE_YEAR = 365 * 24 * 60 * 60 * 1000
      const isPermanent = ttl >= ONE_YEAR

      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        metadata: { ...metadata, isPermanent },
      }

      await this.fs.writeFile(filePath, JSON.stringify(entry), 'utf-8')
      const ttlDisplay = isPermanent ? 'PERMANENT' : `${Math.round(ttl / 1000 / 60)} min`
      console.log(`💾 File cache SET: ${key} (${ttlDisplay})`)
    } catch (error) {
      console.error('Failed to write file cache:', error)
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.fs || typeof window !== 'undefined') return
    try {
      const filePath = this.getCacheFilePath(key)
      if (!filePath) return
      await this.fs.unlink(filePath)
      console.log(`🗑️  File cache DELETE: ${key}`)
    } catch {
      // File doesn't exist — that's fine
    }
  }

  async clear(pattern?: string): Promise<void> {
    if (!this.fs || !this.path || typeof window !== 'undefined') return
    try {
      // ★ FIX: ensureCacheDir returns the path AND creates the dir if missing,
      //   so readdir never throws ENOENT on a cold start or empty cache.
      const cacheDir = await this.ensureCacheDir()
      if (!cacheDir) return

      const files = await this.fs.readdir(cacheDir)
      if (files.length === 0) return

      const targets = pattern
        ? files.filter(f => f.includes(pattern))
        : files

      if (targets.length === 0) {
        console.log(`🗑️  No files matched pattern: ${pattern}`)
        return
      }

      await Promise.allSettled(
        targets.map(f => this.fs!.unlink(this.path!.join(cacheDir, f)))
      )

      console.log(`🗑️  Cleared ${targets.length} file(s)${pattern ? ` matching: ${pattern}` : ' (all)'}`)
    } catch (error) {
      console.error('Failed to clear file cache:', error)
    }
  }

  async cleanExpired(): Promise<void> {
    if (!this.fs || !this.path || typeof window !== 'undefined') return
    try {
      const cacheDir = await this.ensureCacheDir()
      if (!cacheDir) return

      const files = await this.fs.readdir(cacheDir)
      const now = Date.now()
      let cleaned = 0
      let skippedPermanent = 0

      for (const file of files) {
        try {
          const filePath = this.path.join(cacheDir, file)
          const content = await this.fs.readFile(filePath, 'utf-8')
          const entry: CacheEntry<any> = JSON.parse(content)

          if (entry.metadata?.isPermanent) {
            skippedPermanent++
            continue
          }

          if (now > entry.expiresAt) {
            await this.fs.unlink(filePath)
            cleaned++
          }
        } catch {
          // Invalid / unreadable file — skip
        }
      }

      if (cleaned > 0 || skippedPermanent > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired files (kept ${skippedPermanent} permanent)`)
      }
    } catch (error) {
      console.error('Failed to clean expired cache:', error)
    }
  }

  async getStats(): Promise<{ count: number; size: number; permanent: number; temporary: number }> {
    if (!this.fs || !this.path || typeof window !== 'undefined') {
      return { count: 0, size: 0, permanent: 0, temporary: 0 }
    }
    try {
      const cacheDir = await this.ensureCacheDir()
      if (!cacheDir) return { count: 0, size: 0, permanent: 0, temporary: 0 }

      const files = await this.fs.readdir(cacheDir)
      let totalSize = 0, permanentCount = 0, temporaryCount = 0

      for (const file of files) {
        try {
          const filePath = this.path.join(cacheDir, file)
          const [stats, content] = await Promise.all([
            this.fs.stat(filePath),
            this.fs.readFile(filePath, 'utf-8'),
          ])
          totalSize += stats.size
          const entry: CacheEntry<any> = JSON.parse(content)
          entry.metadata?.isPermanent ? permanentCount++ : temporaryCount++
        } catch {
          // Skip invalid files
        }
      }

      return { count: files.length, size: totalSize, permanent: permanentCount, temporary: temporaryCount }
    } catch {
      return { count: 0, size: 0, permanent: 0, temporary: 0 }
    }
  }
}

export const fileCache = new FileCache()