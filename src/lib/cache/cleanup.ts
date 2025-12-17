import { fileCache } from '@/lib/cache/fileCache'

let cleanupInitialized = false

export async function initCacheCleanup() {
  if (cleanupInitialized || typeof window !== 'undefined') return
  cleanupInitialized = true

  // Clean on startup
  await fileCache.cleanExpired()

  // Set up periodic cleanup (every 6 hours)
  setInterval(async () => {
    try {
      await fileCache.cleanExpired()
    } catch (error) {
      console.error('Cache cleanup failed:', error)
    }
  }, 6 * 60 * 60 * 1000) // 6 hours
}