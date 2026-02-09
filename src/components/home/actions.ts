import { ApiService } from '@/services/apiService'
import { NewsItem, TraficNews } from '@/types/fetchData'
import { cache } from 'react'

// Cache wrapper to deduplicate requests during SSR
const createCachedFetch = <T>(
  fn: () => Promise<T>
) => cache(fn)

// Latest Articles
export const getLatestArticles = createCachedFetch(async (): Promise<NewsItem[]> => {
  try {
    const response = await ApiService.fetchArticles({ per_page: 6 })
    return response.data || []
  } catch (error) {
    console.error('Error fetching latest articles:', error)
    return []
  }
})

// Popular Articles
export const getPopularArticles = createCachedFetch(async (): Promise<TraficNews[]> => {
  try {
    const data = await ApiService.fetchMostPopularArticlesFallback({ 
      period: 'week', 
      limit: 5 
    })
    // console.log('Logedd popula data',data)
    return data || []
  } catch (error) {
    console.error('Error fetching popular articles:', error)
    return []
  }
})

// Highlight Articles
export const getHighlightArticles = createCachedFetch(async (): Promise<NewsItem[]> => {
  try {
    const response = await ApiService.fetchArticles({ 
      tags: [217], 
      per_page: 11, 
      orderby: 'date' 
    })
    return response.data || []
  } catch (error) {
    console.error('Error fetching highlight articles:', error)
    return []
  }
})

// Africa/Great Lakes Region Articles
export const getAfricaArticles = createCachedFetch(async (): Promise<NewsItem[]> => {
  try {
    const response = await ApiService.fetchArticles({ 
      tags: [248], 
      per_page: 12 
    })
    return response.data || []
  } catch (error) {
    console.error('Error fetching Africa articles:', error)
    return []
  }
})

// International Articles
export const getInternationalArticles = createCachedFetch(async (): Promise<NewsItem[]> => {
  try {
    const response = await ApiService.fetchArticles({ 
      tags: [249], 
      per_page: 12 
    })
    return response.data || []
  } catch (error) {
    console.error('Error fetching international articles:', error)
    return []
  }
})

// Entertainment Articles
export const getEntertainmentArticles = createCachedFetch(async (): Promise<NewsItem[]> => {
  try {
    const response = await ApiService.fetchArticles({ 
      categories: [161], 
      per_page: 12 
    })
    return response.data || []
  } catch (error) {
    console.error('Error fetching entertainment articles:', error)
    return []
  }
})

// Featured Advertorial
export const getFeaturedAdvertorial = createCachedFetch(async (): Promise<NewsItem[]> => {
  try {
    const data = await ApiService.fetchAdvertorals()
    return data || []
  } catch (error) {
    console.error('Error fetching advertorials:', error)
    return []
  }
})

// Featured Announcement
export const getFeaturedAnnouncement = createCachedFetch(async (): Promise<NewsItem[]> => {
  try {
    const data = await ApiService.fetchAnnouncement()
    return data || []
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return []
  }
})

// Live Event Articles
export const getLiveEventArticles = createCachedFetch(async (): Promise<NewsItem[]> => {
  try {
    const response = await ApiService.fetchArticles({ 
      tags: [199], 
      per_page: 1 
    })
    return response.data || []
  } catch (error) {
    console.error('Error fetching live event articles:', error)
    return []
  }
})

// Main Article
export const getMainArticle = createCachedFetch(async (): Promise<NewsItem[]> => {
  try {
    const response = await ApiService.fetchArticles({ 
      tags: [197], 
      per_page: 1 
    })
    return response.data || []
  } catch (error) {
    console.error('Error fetching main article:', error)
    return []
  }
})

// Top Slider Articles
export const getTopSliderArticles = createCachedFetch(async (): Promise<NewsItem[]> => {
  try {
    const response = await ApiService.fetchArticles({ 
      tags: [296], 
      per_page: 9 
    })
    return response.data || []
  } catch (error) {
    console.error('Error fetching top slider articles:', error)
    return []
  }
})

// Featured Articles
export const getFeaturedArticles = createCachedFetch(async (): Promise<NewsItem[]> => {
  try {
    const response = await ApiService.fetchArticles({ 
      tags: [228], 
      per_page: 8 
    })
    return response.data || []
  } catch (error) {
    console.error('Error fetching featured articles:', error)
    return []
  }
})

// Opinion Articles
export const getOpinion = createCachedFetch(async (): Promise<NewsItem[]> => {
  try {
    const data = await ApiService.fetchOpinions()
    return data.data || []
  } catch (error) {
    console.error('Error fetching opinions:', error)
    return []
  }
})

// Fetch all main news data at once (useful for parallel fetching)
export async function getAllMainNewsData() {
  const [
    latests,
    popular,
    featured,
    africaArticles,
    internationalArticles,
    entertainment,
    advertorial,
    announcement
  ] = await Promise.all([
    getLatestArticles(),
    getPopularArticles(),
    getHighlightArticles(),
    getAfricaArticles(),
    getInternationalArticles(),
    getEntertainmentArticles(),
    getFeaturedAdvertorial(),
    getFeaturedAnnouncement()
  ])

  return {
    latests,
    popular,
    featured,
    africaArticles,
    internationalArticles,
    entertainment,
    advertorial,
    announcement
  }
}