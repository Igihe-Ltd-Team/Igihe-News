// 'use client'

// import { queryKeys } from '@/lib/queryKeys'
// import { useEffect, useRef } from 'react'
// import { Category, NewsItem } from '@/types/fetchData'
// import { PrefetchTracker } from '@/lib/performance-monitor'
// import { useQueryClient } from '@tanstack/react-query'

// interface PrefetchHomeDataProps {
//   children: React.ReactNode
//   initialData: {
//     // categories: Category[]
//     featuredArticles: NewsItem[]
//     popularArticles: NewsItem[]
//     highlightTagArticles: NewsItem[]
//     // latestArticles: NewsItem[]
//     // africaArticles: NewsItem[]
//     // EntertainmentArticles: NewsItem[]
//   }
// }

// export function PrefetchHomeData({ children, initialData }: PrefetchHomeDataProps) {
//   const queryClient = useQueryClient()
//   const hasPrefetched = useRef(false)

//   useEffect(() => {
//     // Check session storage to see if we've already prefetched
//     if (PrefetchTracker.hasPrefetched() || hasPrefetched.current) {
//       return
//     }
    
//     // Check if data is already in cache
//     // const hasCategories = queryClient.getQueryData(queryKeys.categories.lists())
    
//     // If we already have data, skip prefetching but mark as done
//     // if (hasCategories) {
//     //   hasPrefetched.current = true
//     //   PrefetchTracker.markPrefetched()
//     //   return
//     // }

//     // Batch all cache updates together
//     const prefetchData = () => {
//       try {
//         // Categories
//         // queryClient.setQueryData(
//         //   queryKeys.categories.lists(),
//         //   initialData.categories
//         // )
        
//         // Featured articles
//         queryClient.setQueryData(
//           queryKeys.articles.list({ featured: true }),
//           { data: initialData.featuredArticles, pagination: {} }
//         )
        
//         // Popular articles
//         queryClient.setQueryData(
//           queryKeys.articles.popular({ period: 'week' }),
//           initialData.popularArticles
//         )
        
//         // Latest articles
//         // queryClient.setQueryData(
//         //   queryKeys.articles.latest(),
//         //   { data: initialData.latestArticles, pagination: {} }
//         // )
        

//         // Africa articles (by category)
//         // if (initialData.africaArticles?.length > 0) {
//         //   queryClient.setQueryData(
//         //     queryKeys.articles.africa(),
//         //     { data: initialData.africaArticles, pagination: {} }
//         //   )
//         // }

//         // Entertainment articles
//         // if (initialData.EntertainmentArticles?.length > 0) {
//         //   queryClient.setQueryData(
//         //     queryKeys.articles.entertainment(),
//         //     { data: initialData.EntertainmentArticles, pagination: {} }
//         //   )
//         // }

//         // Highlight tag articles
//         if (initialData.highlightTagArticles?.length > 0) {
//           queryClient.setQueryData(
//             queryKeys.articles.highlightTagArticles(63),
//             { data: initialData.highlightTagArticles, pagination: {} }
//           )
//         }

//         // Mark as prefetched
//         hasPrefetched.current = true
//         PrefetchTracker.markPrefetched()
//       } catch (error) {
//         console.error('Error prefetching home data:', error)
//       }
//     }

    


//     // Use requestIdleCallback for better performance
//     if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
//       requestIdleCallback(() => {
//         prefetchData()
//       }, { timeout: 2000 })
//     } else {
//       // Fallback for browsers without requestIdleCallback
//       setTimeout(() => {
//         prefetchData()
//       }, 100)
//     }
//   }, []) // Remove initialData from deps to prevent re-runs

//   return <>{children}</>
// }






// 'use client'

// import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
// import { queryKeys } from '@/lib/queryKeys'
// import { ReactNode, useMemo } from 'react'
// import { NewsItem, Advertisement } from '@/types/fetchData'

// interface PrefetchHomeDataProps {
//   children: ReactNode
//   initialData: {
//     liveEvent: NewsItem[]
//     mainArticle: NewsItem[]
//     topSliders: NewsItem[]
//     featuredArticles: NewsItem[]
//     popularArticles: NewsItem[]
//     highlightTagArticles: NewsItem[]
//     prefetchedAdds: Advertisement[]
//     // Optional below-fold data
//     latestArticles?: NewsItem[]
//     africaArticles?: NewsItem[]
//     entertainmentArticles?: NewsItem[]
//     featuredAdvertorial?: any[]
//     featuredAnnouncement?: any[]
//   }
// }

// export function PrefetchHomeData({ children, initialData }: PrefetchHomeDataProps) {
//   // Create QueryClient once using useMemo
//   // This happens BEFORE render, not in useEffect
//   const queryClient = useMemo(() => {
//     const client = new QueryClient({
//       defaultOptions: {
//         queries: {
//           staleTime: 5 * 60 * 1000, // 5 minutes
//           refetchOnWindowFocus: false,
//           refetchOnMount: false,
//           refetchOnReconnect: false,
//         },
//       },
//     })

//     // ============================================
//     // CRITICAL: Hydrate data IMMEDIATELY
//     // This makes data available to hooks instantly
//     // ============================================

//     // Live Event Articles (tag 199)
//     if (initialData.liveEvent) {
//       client.setQueryData(
//         queryKeys.articles.highlightTagArticles(199),
//         initialData.liveEvent
//       )
//     }

//     // Main Article (tag 197)
//     if (initialData.mainArticle) {
//       client.setQueryData(
//         queryKeys.articles.highlightTagArticles(197),
//         initialData.mainArticle
//       )
//     }

//     // Top Sliders (tag 198)
//     if (initialData.topSliders) {
//       client.setQueryData(
//         queryKeys.articles.highlightTagArticles(198),
//         initialData.topSliders
//       )
//     }

//     // Featured Articles (tag 63)
//     if (initialData.featuredArticles) {
//       client.setQueryData(
//         queryKeys.articles.list({ featured: true }),
//         initialData.featuredArticles
//       )
//     }

//     // Popular Articles
//     if (initialData.popularArticles) {
//       client.setQueryData(
//         queryKeys.articles.popular({ period: 'all' }),
//         initialData.popularArticles
//       )
//     }

//     // Highlight Articles (tag 64)
//     if (initialData.highlightTagArticles) {
//       client.setQueryData(
//         queryKeys.articles.highlightTagArticles(64),
//         initialData.highlightTagArticles
//       )
//     }

//     // Advertisements
//     if (initialData.prefetchedAdds) {
//       client.setQueryData(
//         ['advertisements'],
//         initialData.prefetchedAdds
//       )
//     }

//     // ============================================
//     // OPTIONAL: Below-fold data (if prefetched)
//     // ============================================

//     if (initialData.latestArticles) {
//       client.setQueryData(
//         queryKeys.articles.latest(),
//         initialData.latestArticles
//       )
//     }

//     if (initialData.africaArticles) {
//       client.setQueryData(
//         queryKeys.articles.africa(),
//         initialData.africaArticles
//       )
//     }

//     if (initialData.entertainmentArticles) {
//       client.setQueryData(
//         queryKeys.articles.entertainment(),
//         initialData.entertainmentArticles
//       )
//     }

//     if (initialData.featuredAdvertorial) {
//       client.setQueryData(
//         queryKeys.advertorial.lists(),
//         initialData.featuredAdvertorial
//       )
//     }

//     if (initialData.featuredAnnouncement) {
//       client.setQueryData(
//         queryKeys.announcement.lists(),
//         initialData.featuredAnnouncement
//       )
//     }

//     return client
//   }, []) // Empty deps - only create once

//   return (
//     <HydrationBoundary state={dehydrate(queryClient)}>
//       {children}
//     </HydrationBoundary>
//   )
// }
















'use client'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { ReactNode, useEffect } from 'react'
import { NewsItem, Advertisement } from '@/types/fetchData'
import { useRouter, useSearchParams } from 'next/navigation'

interface PrefetchHomeDataProps {
  children: ReactNode
  initialData: {
    liveEvent: NewsItem[]
    mainArticle: NewsItem[]
    topSliders: NewsItem[]
    featuredArticles: NewsItem[]
    popularArticles: NewsItem[]
    highlightTagArticles: NewsItem[]
    prefetchedAdds: Advertisement[]
    // Optional below-fold data
    latestArticles?: NewsItem[]
    africaArticles?: NewsItem[]
    entertainmentArticles?: NewsItem[]
    featuredAdvertorial?: any[]
    featuredOpinions?: any[]
    featuredAnnouncement?: any[]
  }
}

function createQueryClientWithData(initialData: PrefetchHomeDataProps['initialData']) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
    },
  })

  // ============================================
  // CRITICAL: Hydrate data IMMEDIATELY
  // This makes data available to hooks instantly
  // ============================================
  
  // Live Event Articles (tag 199)
  if (initialData.liveEvent) {
    client.setQueryData(
      queryKeys.articles.highlightTagArticles(199),
      initialData.liveEvent
    )
  }

  // Main Article (tag 197)
  if (initialData.mainArticle) {
    client.setQueryData(
      queryKeys.articles.highlightTagArticles(197),
      initialData.mainArticle
    )
  }

  // Top Sliders (tag 198)
  if (initialData.topSliders) {
    client.setQueryData(
      queryKeys.articles.highlightTagArticles(198),
      initialData.topSliders
    )
  }

  // Featured Articles (tag 63)
  if (initialData.featuredArticles) {
    client.setQueryData(
      queryKeys.articles.list({ featured: true }),
      initialData.featuredArticles
    )
  }

  // Popular Articles
  if (initialData.popularArticles) {
    client.setQueryData(
      queryKeys.articles.popular({ period: 'all' }),
      initialData.popularArticles
    )
  }

  // Highlight Articles (tag 64)
  if (initialData.highlightTagArticles) {
    client.setQueryData(
      queryKeys.articles.highlightTagArticles(64),
      initialData.highlightTagArticles
    )
  }

  // Advertisements
  if (initialData.prefetchedAdds) {
    client.setQueryData(
      ['advertisements'],
      initialData.prefetchedAdds
    )
  }

  // ============================================
  // OPTIONAL: Below-fold data (if prefetched)
  // ============================================
  
  if (initialData.latestArticles) {
    client.setQueryData(
      queryKeys.articles.latest(),
      initialData.latestArticles
    )
  }

  if (initialData.africaArticles) {
    client.setQueryData(
      queryKeys.articles.africa(),
      initialData.africaArticles
    )
  }

  if (initialData.entertainmentArticles) {
    client.setQueryData(
      queryKeys.articles.entertainment(),
      initialData.entertainmentArticles
    )
  }

  if (initialData.featuredAdvertorial) {
    client.setQueryData(
      queryKeys.advertorial.lists(),
      initialData.featuredAdvertorial
    )
  }

  if (initialData.featuredOpinions) {
    client.setQueryData(
      queryKeys.opinion.lists(),
      initialData.featuredOpinions
    )
  }

  

  if (initialData.featuredAnnouncement) {
    client.setQueryData(
      queryKeys.announcement.lists(),
      initialData.featuredAnnouncement
    )
  }

  return client
}

export function PrefetchHomeData({ children, initialData }: PrefetchHomeDataProps) {
  const queryClient = createQueryClientWithData(initialData)


  const search = useSearchParams()
    const router = useRouter()
  
    useEffect(() => {
      if (search.get("fromNav") === "1") {
        router.refresh()
        // optional: clean URL
        router.replace("/", { scroll: false })
      }
    }, [])
    

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}