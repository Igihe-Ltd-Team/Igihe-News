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

  // Fetch all authors - FIXED: Use 'lists' instead of 'list'
  const useAllAuthors = (params?: {
    per_page?: number
    orderby?: string
    order?: 'asc' | 'desc'
  }) => {
    return useQuery({
      queryKey: queryKeys.authors.lists(params), // Changed from .list to .lists
      queryFn: () => ApiService.fetchAllAuthors(params),
      staleTime: 10 * 60 * 1000,
    })
  }

  // Fetch posts by author slug with infinite loading
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
        return lastPage?.pagination?.hasNextPage 
          ? lastPage.pagination.currentPage + 1 
          : undefined
      },
      enabled: !!slug,
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
    useAuthorsWithPosts,
  }
}