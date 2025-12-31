'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NewsItem } from '@/types/fetchData'
import { queryKeys } from '@/lib/queryKeys'

interface HydrateArticleProps {
  article: NewsItem | null
  slug: string
  children: React.ReactNode
}

export default function HydrateArticle({ article, slug, children }: HydrateArticleProps) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (article) {
      // Hydrate React Query cache with server data
      queryClient.setQueryData(
        queryKeys.articles.detail(slug),
        article,
        {
          updatedAt: Date.now(), // Mark as fresh
        }
      )

      console.log('🎯 Hydrated React Query cache:', slug)
    }
  }, [article, slug, queryClient])

  return <>{children}</>
}


