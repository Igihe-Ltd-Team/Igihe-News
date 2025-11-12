'use client'

import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useEffect } from 'react'
import { NewsItem } from '@/types/fetchData'

interface PrefetchHomeDataProps {
  children: React.ReactNode
  initialData: {
    categories: any[]
    featuredArticles: NewsItem[]
    videos: NewsItem[]
    breakingNews: NewsItem[]
  }
}

export function PrefetchHomeData({ children, initialData }: PrefetchHomeDataProps) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Pre-set the data in the query cache
    queryClient.setQueryData(
      queryKeys.categories.lists(),
      initialData.categories
    )
    
    queryClient.setQueryData(
      queryKeys.articles.list({ featured: true }),
      initialData.featuredArticles
    )
    
    queryClient.setQueryData(
      queryKeys.videos.list({}),
      initialData.videos
    )
    
    queryClient.setQueryData(
      queryKeys.articles.list({ breaking: true }),
      initialData.breakingNews
    )
  }, [queryClient, initialData])

  return <>{children}</>
}