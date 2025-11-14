'use client'

import { queryKeys } from '@/lib/queryKeys'
import { useEffect, useRef } from 'react'
import { Category, NewsItem } from '@/types/fetchData'
import { PrefetchTracker } from '@/lib/performance-monitor'
import { useQueryClient } from '@tanstack/react-query'

interface PrefetchHomeDataProps {
  children: React.ReactNode
  initialData: {
    categories: Category[]
    featuredArticles: NewsItem[]
    popularArticles: NewsItem[]
    highlightTagArticles: NewsItem[]
    latestArticles: NewsItem[]
    africaArticles: NewsItem[]
    EntertainmentArticles: NewsItem[]
    videos: NewsItem[]
    // breakingNews: NewsItem[]
  }
}

export function PrefetchHomeData({ children, initialData }: PrefetchHomeDataProps) {
  const queryClient = useQueryClient()
  const hasPrefetched = useRef(false)

  useEffect(() => {
    // Check session storage to see if we've already prefetched
    if (PrefetchTracker.hasPrefetched() || hasPrefetched.current) {
      return
    }
    
    // Check if data is already in cache
    const hasCategories = queryClient.getQueryData(queryKeys.categories.lists())
    
    // If we already have data, skip prefetching but mark as done
    if (hasCategories) {
      hasPrefetched.current = true
      PrefetchTracker.markPrefetched()
      return
    }

    // Batch all cache updates together
    const prefetchData = () => {
      try {
        // Categories
        queryClient.setQueryData(
          queryKeys.categories.lists(),
          initialData.categories
        )
        
        // Featured articles
        queryClient.setQueryData(
          queryKeys.articles.list({ featured: true }),
          { data: initialData.featuredArticles, pagination: {} }
        )
        
        // Popular articles
        queryClient.setQueryData(
          queryKeys.articles.popular({ period: 'week' }),
          initialData.popularArticles
        )
        
        // Latest articles
        queryClient.setQueryData(
          queryKeys.articles.latest(),
          { data: initialData.latestArticles, pagination: {} }
        )
        
        // Videos
        queryClient.setQueryData(
          queryKeys.videos.list({}),
          initialData.videos
        )
        
        // Breaking news
        // queryClient.setQueryData(
        //   queryKeys.articles.list({ breaking: true }),
        //   initialData.breakingNews
        // )

        // Africa articles (by category)
        if (initialData.africaArticles?.length > 0) {
          queryClient.setQueryData(
            queryKeys.articles.africa(),
            { data: initialData.africaArticles, pagination: {} }
          )
        }

        // Entertainment articles
        if (initialData.EntertainmentArticles?.length > 0) {
          queryClient.setQueryData(
            queryKeys.articles.entertainment(),
            { data: initialData.EntertainmentArticles, pagination: {} }
          )
        }

        // Highlight tag articles
        if (initialData.highlightTagArticles?.length > 0) {
          queryClient.setQueryData(
            queryKeys.articles.highlightTagArticles(39),
            { data: initialData.highlightTagArticles, pagination: {} }
          )
        }

        // Mark as prefetched
        hasPrefetched.current = true
        PrefetchTracker.markPrefetched()
      } catch (error) {
        console.error('Error prefetching home data:', error)
      }
    }

    


    // Use requestIdleCallback for better performance
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(() => {
        prefetchData()
      }, { timeout: 2000 })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        prefetchData()
      }, 100)
    }
  }, []) // Remove initialData from deps to prevent re-runs

  return <>{children}</>
}