

// Re-export individual modules for tree-shakeable imports
export * from './cacheManager'
export * from './apiClient'
export * from './articleService'
export * from './categoryService'
export * from './trafficService'
export * from './mediaService'

// ─── Individual module imports for the class wrapper ─────────────────────────
import {
  fetchPostBySlug,
  customPostFetch,
  fetchSinglePost,
  fetchArticles,
  fetchOtherPosts,
  fetchRelatedPosts,
  globalSearch,
  fetchOpinions,
  fetchAdvertorials,
  fetchFacts,
  fetchAnnouncements,
  refreshArticle,
  refreshArticleById,
  getCachedArticle,
} from './articleService'

import {
  fetchCategories,
  fetchCategoryBySlug,
  fetchPostsByCategorySlug,
  fetchPopularCategories,
  fetchCategoriesWithPosts,
} from './categoryService'

import {
  fetchMostPopularArticles,
  fetchMostPopularArticlesFallback,
  fetchPopularArticlesByCategory,
  fetchPopularArticlesByCategorySlug,
  fetchPopularPosts,
} from './trafficService'

import {
  fetchVideos,
  fetchSingleVideo,
  fetchComments,
  submitComment,
  fetchMedia,
  fetchAdvertisements,
  fetchAdsByPosition,
  fetchAdsByPositions,
  fetchAuthorBySlug,
  fetchAuthorById,
  fetchPostsByAuthorSlug,
  fetchPostsByAuthorId,
  fetchAllAuthors,
} from './mediaService'

import {
  clearCache,
  cleanExpiredCache,
  getCacheStats,
  cacheArticleInMemory,
} from './cacheManager'

import { ApiError } from './apiClient'

export { ApiError }


export class ApiService {
  // ── Cache ────────────────────────────────────────
  static getCachedArticle = getCachedArticle
  static cacheArticles = cacheArticleInMemory
  static clearCache = clearCache
  static cleanExpiredCache = cleanExpiredCache
  static getCacheStats = getCacheStats

  // ── Articles ─────────────────────────────────────
  static fetchPostBySlug = fetchPostBySlug
  static customPostFetch = customPostFetch
  static fetchSinglePost = fetchSinglePost
  static fetchArticles = fetchArticles
  static fetchOtherPosts = fetchOtherPosts
  static fetchRelatedPosts = fetchRelatedPosts
  static globalSearch = globalSearch
  static fetchOpinions = fetchOpinions
  static fetchAdvertorals = fetchAdvertorials // preserve original typo
  static fetchAdvertorials = fetchAdvertorials
  static fetchFacts = fetchFacts
  static fetchAnnouncement = fetchAnnouncements // preserve original name
  static fetchAnnouncements = fetchAnnouncements
  static refreshArticle = refreshArticle
  static refreshArticleById = refreshArticleById

  // ── Categories ───────────────────────────────────
  static fetchCategories = fetchCategories
  static fetchCategoryBySlug = fetchCategoryBySlug
  static fetchPostsByCategorySlug = fetchPostsByCategorySlug
  static fetchPopularCategories = fetchPopularCategories
  static fetchCategoriesWithPosts = fetchCategoriesWithPosts

  // ── Traffic / Popular ────────────────────────────
  static fetchMostPopularArticles = fetchMostPopularArticles
  static fetchMostPopularArticlesFallback = fetchMostPopularArticlesFallback
  static fetchPopularArticlesByCategory = fetchPopularArticlesByCategory
  static fetchPopularArticlesByCategorySlug = fetchPopularArticlesByCategorySlug
  static fetchPopularPosts = fetchPopularPosts

  // ── Media / Videos / Ads / Authors ───────────────
  static fetchVideos = fetchVideos
  static fetchSingleVideo = fetchSingleVideo
  static fetchComments = fetchComments
  static submitComment = submitComment
  static fetchMedia = fetchMedia
  static fetchAdvertisements = fetchAdvertisements
  static fetchAdsByPosition = fetchAdsByPosition
  static fetchAdsByPositions = fetchAdsByPositions
  static fetchAuthorBySlug = fetchAuthorBySlug
  static fetchAuthorById = fetchAuthorById
  static fetchPostsByAuthorSlug = fetchPostsByAuthorSlug
  static fetchPostsByAuthorId = fetchPostsByAuthorId
  static fetchAllAuthors = fetchAllAuthors

  // ── Batch & Health ───────────────────────────────
  static async batchRequests(
    requests: Array<{ method: string; url: string; params?: Record<string, any> }>
  ): Promise<any[]> {
    return Promise.allSettled(
      requests.map(async (req) => {
        switch (req.method) {
          case 'categories': return fetchCategories(req.params)
          case 'articles':   return fetchArticles(req.params)
          case 'videos':     return fetchVideos(req.params)
          case 'post':       return fetchSinglePost(req.params?.id)
          case 'video':      return fetchSingleVideo(req.params?.id)
          default: throw new Error(`Unknown method: ${req.method}`)
        }
      })
    ).then(results =>
      results.map(r => (r.status === 'fulfilled' ? r.value : null))
    )
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const { fetchWithTimeout, API_CONFIG } = await import('./apiClient')
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/`, {}, 5000)
      return response.ok
    } catch {
      return false
    }
  }
}
