// hooks/useNewsData.ts
'use client'

import { queryKeys } from '@/lib/queryKeys'
import { ApiService } from '@/services/apiService'
import { articleResponse, Category, NewsItem } from '@/types/fetchData'
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect } from 'react'

export function useNewsData() {
  const queryClient = useQueryClient()

  /* --------------------------------------------------------------------- *
   *  1. Individual queries – all data is prefetched on the server page
   * --------------------------------------------------------------------- */
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: () => ApiService.fetchCategories({ per_page: 100 }),
    staleTime: 30 * 60 * 1000,
  })

  const featuredArticlesQuery = useQuery({
    queryKey: queryKeys.articles.list({ featured: true }),
    queryFn: () => ApiService.fetchArticles({ tags: [31], per_page: 20 }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const popularArticlesQuery = useQuery({
    queryKey: queryKeys.articles.popular({ period: 'week' }),
    queryFn: () => ApiService.fetchMostPopularArticles({ period: 'week', per_page: 10 }),
    staleTime: 10 * 60 * 1000,
  })

  const trendingArticlesQuery = useQuery({
    queryKey: queryKeys.articles.trending(),
    queryFn: () => ApiService.fetchMostPopularArticles({ period: 'day', per_page: 5 }),
    staleTime: 5 * 60 * 1000,
  })

  const highlightTagArticlesQuery = useQuery({
    queryKey: queryKeys.articles.highlightTagArticles(39),
    queryFn: () => ApiService.fetchArticles({ tags: [39], per_page: 7 }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  function useCategoryTagArticles(tagId: number, categoryId?: number) {
  return useQuery({
    queryKey: queryKeys.articles.categoryTagArticles(tagId, categoryId),
    queryFn: () => ApiService.fetchArticles({ 
      tags: [tagId], 
      ...(categoryId && { categories: [categoryId] }),
      per_page: 7 
    }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: !!tagId,
  })
}

  const latestArticlesQuery = useQuery({
    queryKey: queryKeys.articles.latest(),
    queryFn: () => ApiService.fetchArticles({ per_page: 6 }).then(r => r.data),
    staleTime: 2 * 60 * 1000,
  })

  const africaArticlesQuery = useQuery({
    queryKey: queryKeys.articles.africa(),
    queryFn: () =>
      ApiService.fetchPostsByCategorySlug('africa', { per_page: 11 }).then(
        r => r?.posts.data || []
      ),
    staleTime: 5 * 60 * 1000,
  })

  const entertainmentArticlesQuery = useQuery({
    queryKey: queryKeys.articles.entertainment(),
    queryFn: () =>
      ApiService.fetchPostsByCategorySlug('entertainment', { per_page: 11 }).then(
        r => r?.posts.data || []
      ),
    staleTime: 5 * 60 * 1000,
  })

  const videosQuery = useQuery({
    queryKey: queryKeys.videos.list({}),
    queryFn: () => ApiService.fetchVideos({ per_page: 21 }),
    staleTime: 5 * 60 * 1000,
  })

  const featuredAdvertorialQuery = useQuery({
    queryKey: queryKeys.advertorial.lists(),
    queryFn: () => ApiService.fetchAdvertorals().then(r => r || []),
    staleTime: 10 * 60 * 1000,
  })

  const featuredAnnouncementQuery = useQuery({
    queryKey: queryKeys.announcement.lists(),
    queryFn: () => ApiService.fetchAnnouncement().then(r => r || []),
    staleTime: 10 * 60 * 1000,
  })

  /* --------------------------------------------------------------------- *
   *  2. Helper hooks (infinite loading, search, prefetch, …)
   * --------------------------------------------------------------------- */
  const useCategoryArticles = (categoryId?: number) => {
    return useInfiniteQuery({
      queryKey: queryKeys.articles.infinite({ categories: categoryId ? [categoryId] : undefined }),
      queryFn: ({ pageParam = 1 }) =>
        ApiService.fetchArticles({
          categories: categoryId ? [categoryId] : undefined,
          page: pageParam,
          per_page: 20,
        }),
      initialPageParam: 1,
      getNextPageParam: lastPage =>
        lastPage.pagination.hasNextPage ? lastPage.pagination.currentPage + 1 : undefined,
      enabled: !!categoryId,
    })
  }

  const useCategorySlugArticles = (slug?: string) => {
    return useInfiniteQuery({
      queryKey: queryKeys.articles.infiniteBySlug({ categorySlug: slug }),
      queryFn: async ({ pageParam = 1 }) => {
        if (!slug) throw new Error('Category slug is required')
        const response = await ApiService.fetchPostsByCategorySlug(slug, {
          page: pageParam,
          per_page: 8,
        })
        if (!response) throw new Error(`No posts found for category: ${slug}`)
        return response
      },
      initialPageParam: 1,
      getNextPageParam: lastPage =>
        lastPage.posts.pagination.hasNextPage ? lastPage.posts.pagination.currentPage + 1 : undefined,
      enabled: !!slug,
      retry: (failureCount, error) => {
        if (
          error.message.includes('No posts found') ||
          error.message.includes('Category slug is required')
        )
          return false
        return failureCount < 3
      },
    })
  }

  const useCategoryInfo = (slug?: string) => {
    return useQuery({
      queryKey: ['category', slug],
      queryFn: async () => (slug ? ApiService.fetchCategoryBySlug(slug) : null),
      enabled: !!slug,
      staleTime: 5 * 60 * 1000,
      retry: 2,
    })
  }

  const useArticleDetails = (slug: string) => {
    const articleQuery = useQuery({
      queryKey: queryKeys.articles.detail(slug),
      queryFn: () => ApiService.fetchPostBySlug(slug),
      enabled: !!slug && typeof slug === 'string',
      staleTime: 5 * 60 * 1000,
      retry: 2,
    })

    const relatedPostsQuery = useQuery<NewsItem[], Error>({
      queryKey: queryKeys.articles.related(
        articleQuery.data?.id?.toString() || '',
        articleQuery.data?.categories?.[0]?.id
      ),
      queryFn: async () => {
        if (!articleQuery.data) return []
        return ApiService.fetchRelatedPosts(articleQuery.data.id.toString(), [
          articleQuery.data.categories[0].id,
        ])
      },
      enabled: !!articleQuery.data && !!articleQuery.data.id,
      staleTime: 5 * 60 * 1000,
      retry: 2,
    })

    useEffect(() => {
      if (articleQuery.data?.categories?.[0]?.id) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.categories.detail(articleQuery.data.categories[0].id),
          queryFn: () => ApiService.fetchCategoryBySlug(articleQuery.data!.categories![0].slug),
        })
      }
    }, [articleQuery.data, queryClient])

    return {
      article: articleQuery.data,
      articleLoading: articleQuery.isLoading,
      articleError: articleQuery.error,
      relatedPosts: relatedPostsQuery.data || [],
      relatedPostsLoading: relatedPostsQuery.isLoading,
      isLoading: articleQuery.isLoading,
      isError: articleQuery.isError,
      refetchArticle: articleQuery.refetch,
      refetchRelated: relatedPostsQuery.refetch,
      articleQuery,
      relatedPostsQuery,
    }
  }

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

  const prefetchArticle = (articleId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.articles.detail(articleId),
      queryFn: () => ApiService.fetchSinglePost(articleId),
    })
  }

  const prefetchCategory = (categoryId: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.articles.list({ categories: [categoryId] }),
      queryFn: () => ApiService.fetchArticles({ categories: [categoryId], per_page: 10 }),
    })
  }

  const usePopularByCategory = (categoryId?: number) => {
    return useQuery({
      queryKey: queryKeys.articles.popularByCategory(categoryId!, { period: 'week' }),
      queryFn: () =>
        ApiService.fetchPopularArticlesByCategory(categoryId!, {
          period: 'week',
          per_page: 5,
        }),
      enabled: !!categoryId,
      staleTime: 10 * 60 * 1000,
    })
  }

  /* --------------------------------------------------------------------- *
   *  3. Return everything the Home component expects
   * --------------------------------------------------------------------- */
  return {
    /* ---------- data ---------- */
    categories: categoriesQuery.data || [],
    featuredArticles: featuredArticlesQuery.data || [],
    popularArticles: popularArticlesQuery.data || [],
    trendingArticles: trendingArticlesQuery.data || [],
    highlightArticles: highlightTagArticlesQuery.data || [], // ← Home uses HighlightArticles
    latestArticles: latestArticlesQuery.data || [],
    africaArticles: africaArticlesQuery.data || [],
    entertainmentArticles: entertainmentArticlesQuery.data || [],
    videos: videosQuery.data || [],
    featuredAdvertorial: featuredAdvertorialQuery.data || [],
    featuredAnnouncement: featuredAnnouncementQuery.data || [],

    /* ---------- loading states ---------- */
    categoriesLoading: categoriesQuery.isLoading,
    featuredArticlesLoading: featuredArticlesQuery.isLoading,
    popularArticlesLoading: popularArticlesQuery.isLoading,
    trendingArticlesLoading: trendingArticlesQuery.isLoading,
    highlightArticlesLoading: highlightTagArticlesQuery.isLoading,
    latestArticlesLoading: latestArticlesQuery.isLoading,
    africaArticlesLoading: africaArticlesQuery.isLoading,
    entertainmentArticlesLoading: entertainmentArticlesQuery.isLoading,
    videosLoading: videosQuery.isLoading,
    featuredAdvertorialLoading: featuredAdvertorialQuery.isLoading,
    featuredAnnouncementLoading: featuredAnnouncementQuery.isLoading,

    /* ---------- helpers ---------- */
    useCategoryArticles,
    useCategorySlugArticles,
    useCategoryInfo,
    useArticleDetails,
    usePopularByCategory,
    search: searchMutation.mutate,
    searchAsync: searchMutation.mutateAsync,
    searchLoading: searchMutation.isPending,
    prefetchArticle,
    prefetchCategory,
    queryClient,



    useCategoryTagArticles
  }
}