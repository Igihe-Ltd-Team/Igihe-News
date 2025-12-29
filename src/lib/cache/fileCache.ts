// // lib/cache/fileCache.ts
// import type { promises as fsPromises } from 'fs'
// import type { join as pathJoin } from 'path'

// const CACHE_DIR = '.cache'

// interface CacheEntry<T> {
//   data: T
//   timestamp: number
//   expiresAt: number
// }

// // Helper to safely get process.cwd() - isolates the call from bundler
// const getCwd = (): string => {
//   try {
//     // Use globalThis to access process dynamically
//     const proc = (globalThis as any).process
//     return proc && typeof proc.cwd === 'function' ? proc.cwd() : ''
//   } catch {
//     return ''
//   }
// }

// export class FileCache {
//   private fs: typeof fsPromises | null = null
//   private path: { join: typeof pathJoin } | null = null

//   constructor() {
//     // Only import fs/path on server-side
//     if (typeof window === 'undefined') {
//       try {
//         this.fs = require('fs').promises
//         this.path = require('path')
//       } catch {
//         // Module not available
//       }
//     }
//   }

//   private async ensureCacheDir() {
//     if (!this.fs || !this.path) return
    
//     try {
//       const cwd = getCwd()
//       if (!cwd) return
      
//       const cacheDir = this.path.join(cwd, CACHE_DIR)
//       await this.fs.mkdir(cacheDir, { recursive: true })
//     } catch (error) {
//       console.error('Failed to create cache directory:', error)
//     }
//   }

//   private getCacheFilePath(key: string): string {
//     // Return empty string if not on server
//     if (!this.path || typeof window !== 'undefined') return ''
    
//     const cwd = getCwd()
//     if (!cwd) return ''
    
//     // Sanitize key to make it filesystem-safe
//     const sanitizedKey = key
//       .replace(/[^a-z0-9-_:]/gi, '_')
//       .substring(0, 200)
    
//     return this.path.join(cwd, CACHE_DIR, `${sanitizedKey}.json`)
//   }

//   async get<T>(key: string): Promise<T | null> {
//     // Only run on server
//     if (!this.fs || typeof window !== 'undefined') return null

//     try {
//       const filePath = this.getCacheFilePath(key)
//       if (!filePath) return null
      
//       const fileContent = await this.fs.readFile(filePath, 'utf-8')
//       const cacheEntry: CacheEntry<T> = JSON.parse(fileContent)

//       const now = Date.now()
      
//       // Check if cache is expired
//       if (now > cacheEntry.expiresAt) {
//         await this.delete(key)
//         return null
//       }

//       console.log(`✅ File cache HIT: ${key}`)
//       return cacheEntry.data
//     } catch (error) {
//       // File doesn't exist or is invalid
//       return null
//     }
//   }

//   async set<T>(key: string, data: T, ttl: number): Promise<void> {
//     // Only run on server
//     if (!this.fs || typeof window !== 'undefined') return

//     try {
//       await this.ensureCacheDir()
//       const filePath = this.getCacheFilePath(key)
//       if (!filePath) return
      
//       const now = Date.now()
      
//       const cacheEntry: CacheEntry<T> = {
//         data,
//         timestamp: now,
//         expiresAt: now + ttl,
//       }
      
//       await this.fs.writeFile(filePath, JSON.stringify(cacheEntry), 'utf-8')
//       console.log(`💾 File cache SET: ${key} (TTL: ${ttl}ms)`)
//     } catch (error) {
//       console.error('Failed to write file cache:', error)
//     }
//   }

//   async delete(key: string): Promise<void> {
//     if (!this.fs || typeof window !== 'undefined') return

//     try {
//       const filePath = this.getCacheFilePath(key)
//       if (!filePath) return
      
//       await this.fs.unlink(filePath)
//       console.log(`🗑️  File cache DELETE: ${key}`)
//     } catch {
//       // File doesn't exist, ignore
//     }
//   }

//   async clear(pattern?: string): Promise<void> {
//     if (!this.fs || !this.path || typeof window !== 'undefined') return

//     try {
//       const cwd = getCwd()
//       if (!cwd) return
      
//       const cacheDir = this.path.join(cwd, CACHE_DIR)
//       const files = await this.fs.readdir(cacheDir)
      
//       if (pattern) {
//         const matchingFiles = files.filter(file => file.includes(pattern))
//         await Promise.all(
//           matchingFiles.map(file => this.fs!.unlink(this.path!.join(cacheDir, file)))
//         )
//         console.log(`🗑️  Cleared ${matchingFiles.length} files matching: ${pattern}`)
//       } else {
//         await Promise.all(
//           files.map(file => this.fs!.unlink(this.path!.join(cacheDir, file)))
//         )
//         console.log(`🗑️  Cleared all cache (${files.length} files)`)
//       }
//     } catch (error) {
//       console.error('Failed to clear cache:', error)
//     }
//   }

//   async cleanExpired(): Promise<void> {
//     if (!this.fs || !this.path || typeof window !== 'undefined') return

//     try {
//       const cwd = getCwd()
//       if (!cwd) return
      
//       const cacheDir = this.path.join(cwd, CACHE_DIR)
//       const files = await this.fs.readdir(cacheDir)
//       const now = Date.now()
//       let cleaned = 0

//       for (const file of files) {
//         try {
//           const filePath = this.path.join(cacheDir, file)
//           const content = await this.fs.readFile(filePath, 'utf-8')
//           const entry = JSON.parse(content)

//           if (now > entry.expiresAt) {
//             await this.fs.unlink(filePath)
//             cleaned++
//           }
//         } catch {
//           // Invalid file, skip
//         }
//       }

//       if (cleaned > 0) {
//         console.log(`🧹 Cleaned ${cleaned} expired cache files`)
//       }
//     } catch (error) {
//       console.error('Failed to clean expired cache:', error)
//     }
//   }

//   async getStats(): Promise<{ count: number; size: number }> {
//     if (!this.fs || !this.path || typeof window !== 'undefined') return { count: 0, size: 0 }

//     try {
//       const cwd = getCwd()
//       if (!cwd) return { count: 0, size: 0 }
      
//       const cacheDir = this.path.join(cwd, CACHE_DIR)
//       const files = await this.fs.readdir(cacheDir)
//       let totalSize = 0

//       for (const file of files) {
//         const stats = await this.fs.stat(this.path.join(cacheDir, file))
//         totalSize += stats.size
//       }

//       return {
//         count: files.length,
//         size: totalSize,
//       }
//     } catch {
//       return { count: 0, size: 0 }
//     }
//   }
// }

// export const fileCache = new FileCache()



// lib/cache/fileCache.ts - Enhanced version
import type { promises as fsPromises } from 'fs'
import type { join as pathJoin } from 'path'

const CACHE_DIR = '.cache'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  metadata?: {
    contentDate?: string // For articles
    isPermanent?: boolean // Flag for permanent cache
  }
}

// Helper to safely get process.cwd()
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
        // Module not available
      }
    }
  }

  private async ensureCacheDir() {
    if (!this.fs || !this.path) return
    
    try {
      const cwd = getCwd()
      if (!cwd) return
      
      const cacheDir = this.path.join(cwd, CACHE_DIR)
      await this.fs.mkdir(cacheDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create cache directory:', error)
    }
  }

  private getCacheFilePath(key: string): string {
    if (!this.path || typeof window !== 'undefined') return ''
    
    const cwd = getCwd()
    if (!cwd) return ''
    
    const sanitizedKey = key
      .replace(/[^a-z0-9-_:]/gi, '_')
      .substring(0, 200)
    
    return this.path.join(cwd, CACHE_DIR, `${sanitizedKey}.json`)
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.fs || typeof window !== 'undefined') return null

    try {
      const filePath = this.getCacheFilePath(key)
      if (!filePath) return null
      
      const fileContent = await this.fs.readFile(filePath, 'utf-8')
      const cacheEntry: CacheEntry<T> = JSON.parse(fileContent)

      const now = Date.now()
      
      // Check if cache is permanent
      if (cacheEntry.metadata?.isPermanent) {
        console.log(`✅ File cache HIT (PERMANENT): ${key}`)
        return cacheEntry.data
      }
      
      // Check if cache is expired
      if (now > cacheEntry.expiresAt) {
        await this.delete(key)
        console.log(`⏰ Cache expired: ${key}`)
        return null
      }

      const remainingTime = Math.round((cacheEntry.expiresAt - now) / 1000 / 60)
      console.log(`✅ File cache HIT: ${key} (${remainingTime} min remaining)`)
      return cacheEntry.data
    } catch (error) {
      // File doesn't exist or is invalid
      return null
    }
  }

  async set<T>(
    key: string, 
    data: T, 
    ttl: number,
    metadata?: { contentDate?: string }
  ): Promise<void> {
    if (!this.fs || typeof window !== 'undefined') return

    try {
      await this.ensureCacheDir()
      const filePath = this.getCacheFilePath(key)
      if (!filePath) return
      
      const now = Date.now()
      const ONE_YEAR = 365 * 24 * 60 * 60 * 1000
      
      // Check if this is effectively permanent cache (>= 1 year)
      const isPermanent = ttl >= ONE_YEAR
      
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + ttl,
        metadata: {
          ...metadata,
          isPermanent
        }
      }
      
      await this.fs.writeFile(filePath, JSON.stringify(cacheEntry), 'utf-8')
      
      const ttlMinutes = Math.round(ttl / 1000 / 60)
      const ttlDisplay = isPermanent 
        ? 'PERMANENT' 
        : `${ttlMinutes} min`
      
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
      // File doesn't exist, ignore
    }
  }

  async clear(pattern?: string): Promise<void> {
    if (!this.fs || !this.path || typeof window !== 'undefined') return

    try {
      const cwd = getCwd()
      if (!cwd) return
      
      const cacheDir = this.path.join(cwd, CACHE_DIR)
      const files = await this.fs.readdir(cacheDir)
      
      if (pattern) {
        const matchingFiles = files.filter(file => file.includes(pattern))
        await Promise.all(
          matchingFiles.map(file => this.fs!.unlink(this.path!.join(cacheDir, file)))
        )
        console.log(`🗑️  Cleared ${matchingFiles.length} files matching: ${pattern}`)
      } else {
        await Promise.all(
          files.map(file => this.fs!.unlink(this.path!.join(cacheDir, file)))
        )
        console.log(`🗑️  Cleared all cache (${files.length} files)`)
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  async cleanExpired(): Promise<void> {
    if (!this.fs || !this.path || typeof window !== 'undefined') return

    try {
      const cwd = getCwd()
      if (!cwd) return
      
      const cacheDir = this.path.join(cwd, CACHE_DIR)
      const files = await this.fs.readdir(cacheDir)
      const now = Date.now()
      let cleaned = 0
      let skippedPermanent = 0

      for (const file of files) {
        try {
          const filePath = this.path.join(cacheDir, file)
          const content = await this.fs.readFile(filePath, 'utf-8')
          const entry: CacheEntry<any> = JSON.parse(content)

          // Skip permanent cache files
          if (entry.metadata?.isPermanent) {
            skippedPermanent++
            continue
          }

          if (now > entry.expiresAt) {
            await this.fs.unlink(filePath)
            cleaned++
          }
        } catch {
          // Invalid file, skip
        }
      }

      if (cleaned > 0 || skippedPermanent > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired cache files (kept ${skippedPermanent} permanent)`)
      }
    } catch (error) {
      console.error('Failed to clean expired cache:', error)
    }
  }

  async getStats(): Promise<{ 
    count: number
    size: number
    permanent: number
    temporary: number
  }> {
    if (!this.fs || !this.path || typeof window !== 'undefined') {
      return { count: 0, size: 0, permanent: 0, temporary: 0 }
    }

    try {
      const cwd = getCwd()
      if (!cwd) return { count: 0, size: 0, permanent: 0, temporary: 0 }
      
      const cacheDir = this.path.join(cwd, CACHE_DIR)
      const files = await this.fs.readdir(cacheDir)
      let totalSize = 0
      let permanentCount = 0
      let temporaryCount = 0

      for (const file of files) {
        try {
          const filePath = this.path.join(cacheDir, file)
          const stats = await this.fs.stat(filePath)
          totalSize += stats.size
          
          const content = await this.fs.readFile(filePath, 'utf-8')
          const entry: CacheEntry<any> = JSON.parse(content)
          
          if (entry.metadata?.isPermanent) {
            permanentCount++
          } else {
            temporaryCount++
          }
        } catch {
          // Skip invalid files
        }
      }

      return {
        count: files.length,
        size: totalSize,
        permanent: permanentCount,
        temporary: temporaryCount
      }
    } catch {
      return { count: 0, size: 0, permanent: 0, temporary: 0 }
    }
  }
}

export const fileCache = new FileCache()