import { QueryClient, DefaultOptions } from '@tanstack/react-query'

// On the server a QueryClient lives for one render and is then discarded, so its cache needs no garbage collection. TanStack's
// own default there is Infinity (no timers); a finite value starts a timer for EVERY query of EVERY server-rendered page,
// and each timer keeps its query, its client and the data inside alive until it fires. At production traffic that was
// ~10,000 pending timers and a process that grew past 3 GB (found with a timer probe: all of them came from scheduleGc).
const isServer = typeof window === 'undefined'

/** A `gcTime` for one query: the given time in the browser, never (no timer) on the server. Use this instead of a bare number. */
export const gcTimeFor = (browserMs: number): number => (isServer ? Infinity : browserMs)

const queryConfig: DefaultOptions = {
  queries: {
    // Stale time: how long data is considered fresh
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Cache time: how long unused data stays in memory
    gcTime: isServer ? Infinity : 10 * 60 * 1000, // browser: 10 minutes (formerly cacheTime); server: never schedule a timer
    
    // Retry configuration for failed requests
    retry: (failureCount, error) => {
      if (isServer) return false // nothing is fetched while rendering on the server, and a retry would only add a timer
      // Don't retry on 404s, and don't retry on 429s — a rate-limit response
      // means the server just asked us to slow down, so immediately firing
      // again (even with backoff) just adds to the same limit window instead
      // of letting it clear.
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('429'))) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch configuration
    refetchOnWindowFocus: false, // Don't refetch on window focus for better UX
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnReconnect: true, // Refetch on reconnect
    
    // Network mode
    networkMode: 'online', // Only fetch when online
  },
  mutations: {
    retry: 1,
    networkMode: 'online',
  },
}

// Create a client instance that persists across renders
let browserQueryClient: QueryClient | undefined = undefined

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: queryConfig,
  })
}

export function getQueryClient() {
  // Server: always make a new query client
  if (typeof window === 'undefined') {
    return makeQueryClient()
  }
  
  // Browser: make a new query client if we don't already have one
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  
  return browserQueryClient
}

// Export for backward compatibility
export const queryClient = getQueryClient()