const store = new Map<string, any>()

export const fileCache = {
  get: jest.fn(async <T>(key: string): Promise<T | null> => {
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
}