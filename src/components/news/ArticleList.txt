'use client'

import { useInView } from 'react-intersection-observer'
import { useNewsData } from '@/hooks/useNewsData'
import { useEffect } from 'react'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { ArticleCard } from './ArticleCard'

interface ArticleListProps {
  categoryId?: number
}

export function ArticleList({ categoryId }: ArticleListProps) {
  const { ref, inView } = useInView()
  const { useCategoryArticles } = useNewsData()
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useCategoryArticles(categoryId)

  // Auto-load more when scrolled to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const allArticles = data?.pages.flatMap(page => page.data) || []

  return (
    <div className="space-y-6">
      {allArticles.map((article, index) => (
        <ArticleCard
          key={article.id}
          article={article}
          priority={index < 3} // Lazy load after first 3
        />
      ))}
      
      {/* Loading trigger */}
      <div ref={ref} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && <LoadingSpinner />}
        {!hasNextPage && <p>No more articles to load</p>}
      </div>
    </div>
  )
}