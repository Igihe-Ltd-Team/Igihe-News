import '@testing-library/jest-dom'

process.env.NEXT_PUBLIC_WORDPRESS_API_URL = 'https://new.igihe.com/wp-json/wp/v2'

// Silence noise unless TEST_VERBOSE is set
if (!process.env.TEST_VERBOSE) {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
}

// Mock fileCache before any imports that might use it
jest.mock('@/lib/cache/fileCache', () => {
  const store = new Map<string, any>()

  return {
    fileCache: {
      get: jest.fn(async <T,>(key: string): Promise<T | null> => {
        return store.has(key) ? store.get(key) : null
      }),
      set: jest.fn(async (key: string, data: any, _ttl: number, _meta?: any) => {
        store.set(key, data)
      }),
      delete: jest.fn(async (key: string) => {
        store.delete(key)
      }),
      clear: jest.fn(async (pattern?: string) => {
        if (pattern) {
          for (const key of store.keys()) {
            if (key.includes(pattern)) store.delete(key)
          }
        } else {
          store.clear()
        }
      }),
      cleanExpired: jest.fn(async () => {}),
      getStats: jest.fn(async () => ({
        count: store.size,
        size: 1024,
        permanent: 0,
        temporary: store.size,
      })),
      // Test helper: reset internal store
      __reset: () => store.clear(),
    },
  }
})

// Set default fileCache mock implementations globally
beforeEach(() => {
  const { fileCache } = require('@/lib/cache/fileCache')
  
  // Reset all mocks to their default behavior
  jest.clearAllMocks()
  
  // Ensure mocks have default implementations
  if (fileCache.get && typeof fileCache.get.mockResolvedValue === 'function') {
    fileCache.get.mockResolvedValue(null)
  }
  if (fileCache.set && typeof fileCache.set.mockResolvedValue === 'function') {
    fileCache.set.mockResolvedValue(undefined)
  }
  if (fileCache.delete && typeof fileCache.delete.mockResolvedValue === 'function') {
    fileCache.delete.mockResolvedValue(undefined)
  }
  if (fileCache.clear && typeof fileCache.clear.mockResolvedValue === 'function') {
    fileCache.clear.mockResolvedValue(undefined)
  }
  if (fileCache.cleanExpired && typeof fileCache.cleanExpired.mockResolvedValue === 'function') {
    fileCache.cleanExpired.mockResolvedValue(undefined)
  }
  if (fileCache.getStats && typeof fileCache.getStats.mockResolvedValue === 'function') {
    fileCache.getStats.mockResolvedValue({ 
      count: 0, 
      size: 0, 
      permanent: 0, 
      temporary: 0 
    })
  }
})