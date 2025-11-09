// hooks/useAuthorData.ts
'use client'

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { ApiService } from '@/services/apiService'
import { queryKeys } from '@/lib/queryKeys'

export function useAuthorData() {
  // Fetch author by slug
  const useAuthorBySlug = (slug: string) => {
    return useQuery({
      queryKey: queryKeys.authors.detail(slug),
      queryFn: () => ApiService.fetchAuthorBySlug(slug),
      enabled: !!slug,
      staleTime: 5 * 60 * 1000,
    })
  }

  // Fetch author by ID
  const useAuthorById = (id: number) => {
    return useQuery({
      queryKey: queryKeys.authors.byId(id),
      queryFn: () => ApiService.fetchAuthorById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    })
  }

  // Fetch all authors
  const useAllAuthors = (params?: {
    per_page?: number
    orderby?: string
    order?: 'asc' | 'desc'
  }) => {
    return useQuery({
      queryKey: queryKeys.authors.list(params),
      queryFn: () => ApiService.fetchAllAuthors(params),
      staleTime: 10 * 60 * 1000,
    })
  }

  // Fetch posts by author slug with infinite loading - FIXED VERSION
  const usePostsByAuthorSlug = (
    slug: string, 
    params?: {
      per_page?: number
      orderby?: string
      order?: 'asc' | 'desc'
    }
  ) => {
    return useInfiniteQuery({
      queryKey: queryKeys.articles.byAuthorSlug(slug, params),
      queryFn: async ({ pageParam = 1 }) => {
        try {
          const result = await ApiService.fetchPostsByAuthorSlug(slug, {
            ...params,
            page: pageParam,
          })
          
          // Ensure data is always an array and handle undefined cases
          const postsData = result?.data || []
          const perPage = params?.per_page || 10
          
          return {
            data: postsData,
            author: result?.author || null,
            pagination: {
              currentPage: pageParam,
              hasNextPage: postsData.length === perPage
            }
          }
        } catch (error) {
          console.error('Error in usePostsByAuthorSlug:', error)
          // Return empty data structure on error
          return {
            data: [],
            author: null,
            pagination: {
              currentPage: pageParam,
              hasNextPage: false
            }
          }
        }
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        // Safely check if there's a next page
        return lastPage?.pagination?.hasNextPage 
          ? lastPage.pagination.currentPage + 1 
          : undefined
      },
      enabled: !!slug,
    })
  }

  // Fetch popular authors
  const usePopularAuthors = (limit: number = 10) => {
    return useQuery({
      queryKey: queryKeys.authors.popular(limit),
      queryFn: () => ApiService.fetchPopularAuthors(limit),
      staleTime: 10 * 60 * 1000,
    })
  }

  // Fetch authors with recent posts
  const useAuthorsWithPosts = (limit: number = 10) => {
    return useQuery({
      queryKey: queryKeys.authors.withPosts(limit),
      queryFn: () => ApiService.fetchAuthorsWithPosts(limit),
      staleTime: 5 * 60 * 1000,
    })
  }

  return {
    // Queries
    useAuthorBySlug,
    useAuthorById,
    useAllAuthors,
    usePostsByAuthorSlug,
    usePopularAuthors,
    useAuthorsWithPosts,
  }
}