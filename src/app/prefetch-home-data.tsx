'use client'
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { ReactNode, useEffect } from 'react'
import { NewsItem, Advertisement, TraficNews } from '@/types/fetchData'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface PrefetchHomeDataProps {
  children: ReactNode
  initialData: {
    liveEvent: NewsItem[]
    mainArticle: NewsItem[]
    topSliders: NewsItem[]
    featuredArticles: NewsItem[]
    popularArticles: TraficNews[]
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
      queryKeys.articles.highlightTagArticles(217),
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
  const pathname = usePathname();

  // useEffect(() => {
    // if (search.get("fromNav") === "1") {
    //   router.refresh()
    //   // optional: clean URL
    //   router.replace("/", { scroll: false }) 
    // }


    // if (search.get("fromNav") === "1") {
    //   const params = new URLSearchParams(search.toString());
    //   params.delete("fromNav");

    //   const newUrl = params.toString()
    //     ? `${pathname}?${params.toString()}`
    //     : pathname;

    //   router.replace(newUrl, { scroll: false });
    // }

  // }, [])


  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}