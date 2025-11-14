import { ApiService } from '@/services/apiService'
import { Category, NewsItem } from '@/types/fetchData'

export interface HomePageData {
  categories: Category[]
  featuredArticles: NewsItem[]
  popularArticles: NewsItem[]
  highlightTagArticles: NewsItem[]
  latestArticles: NewsItem[]
  africaArticles: NewsItem[]
  EntertainmentArticles: NewsItem[]
  videos: NewsItem[]
  breakingNews: NewsItem[]
}

/**
 * Fetches all initial data for the home page in parallel
 * This should be called from a Server Component or getServerSideProps
 */
export async function prefetchHomeData(): Promise<HomePageData> {
  try {
    // Fetch all data in parallel for maximum performance
    const [
      categories,
      featuredResponse,
      popularArticles,
      latestResponse,
      videos,
      highlightResponse,
      breakingResponse,
      africaResponse,
      entertainmentResponse,
      // advertoralsResponse,
      // announcementResponse
    ] = await Promise.allSettled([
      // Categories
      ApiService.fetchCategories({ per_page: 100 }),
      
      // Featured articles
      ApiService.fetchArticles({ tags: [31], per_page: 20 }),
      // Popular articles
      ApiService.fetchMostPopularArticles({ period: 'week', per_page: 10 }),
      
      // Latest articles
      ApiService.fetchArticles({ per_page: 6, orderby: 'date' }),
      
      // Videos
      ApiService.fetchVideos({ per_page: 21 }),
      // highlight
      ApiService.fetchArticles({ tags: [39], per_page: 15, orderby: 'date' }),
      // Breaking news (customize based on your tag/category structure)
      ApiService.fetchArticles({ per_page: 5, orderby: 'date' }),
      
      // Africa category articles (adjust category slug as needed)
      ApiService.fetchPostsByCategorySlug('africa', { per_page: 11 }),
      
      // Entertainment articles
      ApiService.fetchPostsByCategorySlug('entertainment', { per_page: 11 }),

      // ApiService.fetchAdvertorals(),
      // ApiService.fetchAnnouncement()
    ])

    return {
      categories: categories.status === 'fulfilled' ? categories.value : [],
      featuredArticles: featuredResponse.status === 'fulfilled' ? featuredResponse.value.data : [],
      popularArticles: popularArticles.status === 'fulfilled' ? popularArticles.value : [],
      latestArticles: latestResponse.status === 'fulfilled' ? latestResponse.value.data : [],
      videos: videos.status === 'fulfilled' ? videos.value : [],
      breakingNews: breakingResponse.status === 'fulfilled' ? breakingResponse.value.data : [],
      africaArticles: africaResponse.status === 'fulfilled' && africaResponse.value ? africaResponse.value.posts.data : [],
      EntertainmentArticles: entertainmentResponse.status === 'fulfilled' && entertainmentResponse.value ? entertainmentResponse.value.posts.data : [],
      highlightTagArticles: highlightResponse.status === 'fulfilled' ? highlightResponse.value.data : [],
      // advertoralsArticles:advertoralsResponse.status === 'fulfilled' ? advertoralsResponse.value : [], 
      // announcementArticles:announcementResponse.status === 'fulfilled' ? announcementResponse.value : [], 
    }
  } catch (error) {
    console.error('Error prefetching home data:', error)
    
    // Return empty data structure on error
    return {
      categories: [],
      featuredArticles: [],
      popularArticles: [],
      highlightTagArticles: [],
      latestArticles: [],
      africaArticles: [],
      EntertainmentArticles: [],
      videos: [],
      breakingNews: []
      // advertoralsArticles:[]
      // announcementArticles:[]
    }
  }
}

/**
 * Prefetch data with cache control
 * Useful for ISR or timed revalidation
 */
export async function prefetchHomeDataWithCache(revalidate: number = 300) {
  const data = await prefetchHomeData()
  
  return {
    data,
    revalidate // Revalidate every 5 minutes (300 seconds)
  }
}