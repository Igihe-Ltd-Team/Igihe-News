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
    // Only hydrate if we have valid article data
    if (article?.id) {
      // Set query data without complex comparisons
      // Server data is always the source of truth on initial load
      queryClient.setQueryData(
        queryKeys.articles.detail(slug),
        article
      )
    }
  }, [article, slug, queryClient])

  // Render immediately - don't wait for hydration
  return <>{children}</>
}