'use client'

import { queryKeys } from '@/lib/queryKeys'
import { ApiService } from '@/services/apiService'
import { articleResponse, NewsItem } from '@/types/fetchData'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useNewsData() {
  const queryClient = useQueryClient()

  // Categories
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: () => ApiService.fetchCategories({ per_page: 100 }),
  })

  // Featured articles (homepage)
  const featuredArticlesQuery = useQuery({
    queryKey: queryKeys.articles.list({ featured: true }),
    queryFn: () => ApiService.fetchArticles({ per_page: 15 }),
  })

  // Videos
  const videosQuery = useQuery({
    queryKey: queryKeys.videos.list({}),
    queryFn: () => ApiService.fetchVideos({ per_page: 21 }),
  })

  // Category-specific articles with infinite loading
  const useCategoryArticles = (categoryId?: number) => {
    return useInfiniteQuery({
      queryKey: queryKeys.articles.infinite({ categories: categoryId ? [categoryId] : undefined }),
      queryFn: ({ pageParam = 1 }) => 
        ApiService.fetchArticles({ 
          categories: categoryId ? [categoryId] : undefined,
          page: pageParam, 
          per_page: 20 
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => 
        lastPage.pagination.hasNextPage 
          ? lastPage.pagination.currentPage + 1 
          : undefined,
      enabled: !!categoryId,
    })
  }

  // Search mutation
  const searchMutation = useMutation<
    { articles: articleResponse<NewsItem>; videos?: NewsItem[] },
    Error,
    { query: string; categoryId?: number }
  >({
    mutationFn: async ({ query, categoryId }) => {
      if (categoryId) {
        const articles = await ApiService.fetchArticles({
          search: query,
          categories: [categoryId],
          per_page: 20,
        })
        return { articles }
      }

      const [articles, videos] = await Promise.all([
        ApiService.fetchArticles({ search: query, per_page: 20 }),
        ApiService.fetchVideos({ search: query, per_page: 20 }),
      ])
      return { articles, videos }
    },
  })

  // Prefetch articles on hover
  const prefetchArticle = (articleId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.articles.detail(articleId),
      queryFn: () => ApiService.fetchSinglePost(articleId),
    })
  }

  // Prefetch category data
  const prefetchCategory = (categoryId: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.articles.list({ categories: [categoryId] }),
      queryFn: () => ApiService.fetchArticles({ categories: [categoryId], per_page: 10 }),
    })
  }

  return {
    // Queries
    categories: categoriesQuery.data || [],
    categoriesLoading: categoriesQuery.isLoading,
    categoriesError: categoriesQuery.error,
    
    featuredArticles: featuredArticlesQuery.data?.data || [],
    featuredArticlesLoading: featuredArticlesQuery.isLoading,
    
    videos: videosQuery.data || [],
    videosLoading: videosQuery.isLoading,

    // Methods
    useCategoryArticles,
    search: searchMutation.mutate,
    searchAsync: searchMutation.mutateAsync,
    searchLoading: searchMutation.isPending,
    
    prefetchArticle,
    prefetchCategory,

    // Query client for direct access
    queryClient,
  }
}

// Custom hook for fetching category by slug
export function useCategorySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.categories.bySlug(slug),
    queryFn: () => ApiService.fetchCategoryBySlug(slug),
    enabled: !!slug && typeof slug === 'string',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

// Custom hook for fetching article details with related data
export function useArticleDetails(slug: string) {
  const queryClient = useQueryClient()

  // Main article query
  const articleQuery = useQuery({
    queryKey: queryKeys.articles.detail(slug),
    queryFn: () => ApiService.fetchPostBySlug(slug),
    enabled: !!slug && typeof slug === 'string',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })

  // Related posts query (auto-fetched when article is loaded)
  // const relatedPostsQuery = useQuery({
  //   queryKey: queryKeys.articles.related(
  //     articleQuery.data?.id?.toString() || '',
  //     articleQuery.data?.categories?.[0]?.id
  //   ),
  //   queryFn: () => {
  //     if (!articleQuery.data) {
  //       return { data: [] }
  //     }
  //     return ApiService.fetchRelatedPosts(
  //       articleQuery.data.id.toString(),
  //       articleQuery.data.categories?.[0]?.id ? [articleQuery.data.categories[0].id] : []
  //     )
  //   },
  //   enabled: !!articleQuery.data && !!articleQuery.data.id,
  //   staleTime: 5 * 60 * 1000,
  //   retry: 2,
  // })

  // Prefetch category data when article is loaded
  useEffect(() => {
    if (articleQuery.data?.categories?.[0]?.id) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.categories.detail(articleQuery.data.categories[0].id),
        queryFn: () => ApiService.fetchCategoryBySlug(articleQuery.data!.categories![0].slug),
      })
    }
  }, [articleQuery.data, queryClient])

  return {
    // Article data
    article: articleQuery.data,
    articleLoading: articleQuery.isLoading,
    articleError: articleQuery.error,
    
    // Related posts
    // relatedPosts: relatedPostsQuery.data || [],
    // relatedPostsLoading: relatedPostsQuery.isLoading,
    
    // Combined states
    isLoading: articleQuery.isLoading,
    isError: articleQuery.isError,
    
    // Refetch functions
    refetchArticle: articleQuery.refetch,
    // refetchRelated: relatedPostsQuery.refetch,
    useArticleDetails,
    // Individual query objects for advanced usage
    articleQuery,
    // relatedPostsQuery,
  }
}