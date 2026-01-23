'use client'

import { AdPositionKey } from '@/lib/adPositions'
import { queryKeys } from '@/lib/queryKeys'
import { ApiService } from '@/services/apiService'
import { Advertisement } from '@/types/fetchData'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// Individual query hooks - each component imports only what it needs

export function useLiveEventArticles() {
  return useQuery({
    queryKey: queryKeys.articles.highlightTagArticles(199),
    queryFn: () => ApiService.fetchArticles({ tags: [199], per_page: 1 }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useMainArticle() {
  return useQuery({
    queryKey: queryKeys.articles.highlightTagArticles(197),
    queryFn: () => ApiService.fetchArticles({ tags: [197], per_page: 1 }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTopSliderArticles() {
  return useQuery({
    queryKey: queryKeys.articles.highlightTagArticles(296),
    queryFn: () => ApiService.fetchArticles({ tags: [296], per_page: 9 }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useFeaturedArticles() {
  return useQuery({
    queryKey: queryKeys.articles.list({ featured: true }),
    queryFn: () => ApiService.fetchArticles({ tags: [228], per_page: 8 }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function usePopularArticles() {
  return useQuery({
    queryKey: queryKeys.articles.popular({ period: 'all' }),
    queryFn: () => ApiService.fetchMostPopularArticlesFallback({ period: 'week', per_page: 5 }),
    staleTime: 10 * 60 * 1000,
  })
}

export function useHighlightArticles() {
  return useQuery({
    queryKey: queryKeys.articles.highlightTagArticles(217),
    queryFn: () => ApiService.fetchArticles({ tags: [217], per_page: 11, orderby: 'date' }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLatestArticles() {
  return useQuery({
    queryKey: queryKeys.articles.latest(),
    queryFn: () => ApiService.fetchArticles({ per_page: 6 }).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })
}

export function useAfricaArticles() {
  return useQuery({
    queryKey: queryKeys.articles.africa(),
    queryFn: () => ApiService.fetchArticles({ tags: [248], per_page: 12 }).then(r => r?.data || []),
    staleTime: 5 * 60 * 1000,
  })
}
export function useInternationalArticles() {
  return useQuery({
    queryKey: queryKeys.articles.highlightTagArticles(249),
    queryFn: () => ApiService.fetchArticles({ tags: [249], per_page: 12 }).then(r => r?.data || []),
    staleTime: 5 * 60 * 1000,
  })
}

export function useEntertainmentArticles() {
  return useQuery({
    queryKey: queryKeys.articles.entertainment(),
    queryFn: () => ApiService.fetchArticles({ categories: [161], per_page: 12 }).then(r => r?.data || []),
    staleTime: 5 * 60 * 1000,
  })
}

export function useFeaturedAdvertorial() {
  return useQuery({
    queryKey: queryKeys.advertorial.lists(),
    queryFn: () => ApiService.fetchAdvertorals().then(r => r || []),
    staleTime: 10 * 60 * 1000,
  })
}

export function useOpinion() {
  return useQuery({
    queryKey: queryKeys.opinion.lists(),
    queryFn: () => ApiService.fetchOpinions().then(r => r || []),
    staleTime: 10 * 60 * 1000,
  })
}

export function useFeaturedAnnouncement() {
  return useQuery({
    queryKey: queryKeys.announcement.lists(),
    queryFn: () => ApiService.fetchAnnouncement().then(r => r || []),
    staleTime: 10 * 60 * 1000,
  })
}


export function useAdvertisements() {
  return useQuery({
    queryKey: ['advertisements'],
    queryFn: () => ApiService.fetchAdvertisements(),
    staleTime: 10 * 60 * 1000,
  })
}


export function useAdsByPosition(position: AdPositionKey, enabled = true) {
  return useQuery({
    queryKey: queryKeys.ads.byPosition(position),
    queryFn: () => ApiService.fetchAdsByPosition(position),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled,
  })
}

export function usePrefetchAds() {
  const queryClient = useQueryClient()

  return (position: AdPositionKey) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.ads.byPosition(position),
      queryFn: () => ApiService.fetchAdsByPosition(position),
      staleTime: 10 * 60 * 1000,
    })
  }
}


export function useAdsFromCache(position: AdPositionKey) {
  const queryClient = useQueryClient()
  const allAds = queryClient.getQueryData<Advertisement[]>(['advertisements'])

  if (allAds) {
    return allAds.filter(ad => ad.class_list.includes(`tag-${position}`))
  }
  return null
}