'use client'

import { queryKeys } from '@/lib/queryKeys'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { ApiService } from '@/services/apiService'
import { NewsItem } from '@/types/fetchData'

// Categories hook
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: () => ApiService.fetchCategories({ per_page: 100 }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Articles with infinite loading hook
export function useInfiniteArticles(filters?: { categories?: number[]; search?: string }) {
  return useInfiniteQuery({
    queryKey: queryKeys.articles.infinite(filters),
    queryFn: ({ pageParam = 1 }) => 
      ApiService.fetchArticles({ 
        ...filters, 
        page: pageParam, 
        per_page: 20 
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.pagination.hasNextPage 
        ? lastPage.pagination.currentPage + 1 
        : undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes for articles
  })
}

// Single article hook
export function useArticle(id: string, initialData?: NewsItem) {
  return useQuery({
    queryKey: queryKeys.articles.detail(id),
    queryFn: () => ApiService.fetchSinglePost(id),
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id, // Only fetch if ID is provided
  })
}

// Videos hook
export function useVideos(filters?: { search?: string }) {
  return useQuery({
    queryKey: queryKeys.videos.list(filters),
    queryFn: () => ApiService.fetchVideos({ ...filters, per_page: 21 }),
    staleTime: 5 * 60 * 1000,
  })
}

// Search hook
export function useSearch(query: string, filters?: { categoryId?: number }) {
  return useQuery({
    queryKey: queryKeys.search.query(query, filters),
    queryFn: () => {
      if (filters?.categoryId) {
        return ApiService.fetchArticles({
          search: query,
          categories: [filters.categoryId],
          per_page: 20,
        })
      }
      return Promise.all([
        ApiService.fetchArticles({ search: query, per_page: 20 }),
        ApiService.fetchVideos({ search: query, per_page: 20 }),
      ])
    },
    enabled: query.length > 2, // Only search when query has at least 3 characters
    staleTime: 2 * 60 * 1000,
  })
}

// Popular posts hook
export function usePopularPosts(days?: number) {
  return useQuery({
    queryKey: queryKeys.articles.list({ popular: true, days }),
    queryFn: () => ApiService.fetchPopularPosts({ days }),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Related posts hook
export function useRelatedPosts(postId: string, categories: number[], tags: number[] = []) {
  return useQuery({
    queryKey: queryKeys.articles.detail(postId, 'related'),
    queryFn: () => ApiService.fetchRelatedPosts(postId, categories, tags),
    enabled: !!postId && categories.length > 0,
    staleTime: 10 * 60 * 1000,
  })
}

// Comments hook
export function useComments(postId: number) {
  return useQuery({
    queryKey: queryKeys.articles.detail(postId.toString(), 'comments'),
    queryFn: () => ApiService.fetchComments(postId),
    enabled: !!postId,
  })
}

// AI Features (commented out as per your original)
/*
export function useArticleSummary(articleId: string) {
  return useQuery({
    queryKey: queryKeys.ai.summaries(articleId),
    queryFn: () => AIService.generateSummary(articleId),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!articleId,
  })
}

export function useAiRecommendations(userId?: string) {
  return useQuery({
    queryKey: queryKeys.ai.recommendations,
    queryFn: () => AIService.getRecommendations(userId),
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}
*/