'use client'

import { useQuery } from '@tanstack/react-query'
import { ApiService } from '@/services/apiService'
import { transformToNewsItem } from '@/types/fetchData'
import PopularNews from '../news/PopularNews'
import NewsSkeleton from '../NewsSkeleton'

export default function PopularNewsFetcher() {
  const { data, isLoading } = useQuery({
    queryKey: ['popular', 'week', 5],
    queryFn: () => ApiService.fetchMostPopularArticlesFallback({ period: 'week', limit: 5 }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  if (isLoading) return <NewsSkeleton count={3} />

  const articles = (data ?? [])
    .filter(item => item?.url && item?.title)
    .map(transformToNewsItem)

  return <PopularNews articles={articles} name="Popular News" />
}
