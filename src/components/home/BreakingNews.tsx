'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { ApiService } from '@/services/apiService'
import { Marquee } from '../ui/Marquee'
import { queryClient } from '@/lib/react-query'

export function BreakingNews() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.articles.list({ breaking: true }),
    queryFn: () => ApiService.fetchArticles({ 
      categories: [1], // Breaking news category ID
      per_page: 10 
    }),
    refetchInterval: 60 * 1000, // Refetch every minute
    staleTime: 30 * 1000, // Consider stale after 30 seconds
  })

  const breakingNews = data?.data || []

  if (isLoading) {
    return (
      <div className="bg-red-600 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-4">
            <span className="font-bold bg-white text-red-600 px-2 py-1 rounded text-sm">
              BREAKING
            </span>
            <div className="animate-pulse bg-red-500 h-4 w-64 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || breakingNews.length === 0) {
    return null
  }

  return (
    <div className="bg-red-600 text-white py-2 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-4">
          <span className="font-bold bg-white text-red-600 px-2 py-1 rounded text-sm whitespace-nowrap">
            BREAKING
          </span>
          <Marquee>
            {breakingNews.map((article, index) => (
              <span key={article.id} className="mx-4 whitespace-nowrap">
                <a 
                  href={`/news/${article.slug}`}
                  className="hover:underline transition-colors"
                  onMouseEnter={() => 
                    queryClient.prefetchQuery({
                      queryKey: queryKeys.articles.detail(article.id),
                      queryFn: () => ApiService.fetchSinglePost(article.id),
                    })
                  }
                >
                  {article.title.rendered}
                </a>
                {index < breakingNews.length - 1 && ' • '}
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </div>
  )
}