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
}

export async function prefetchHomeData(): Promise<HomePageData> {
  try {
    // Fetch all data in parallel for maximum performance
    const [
      categories,
      featuredResponse,
      popularArticles,
      latestResponse,
      highlightResponse,
      africaResponse,
      entertainmentResponse,
    ] = await Promise.allSettled([
      // Categories
      ApiService.fetchCategories({ per_page: 100 }),
      
      // Featured articles
      ApiService.fetchArticles({ tags: [31], per_page: 20 }),
      // Popular articles
      ApiService.fetchMostPopularArticlesFallback({ period: 'week', per_page: 5 }),
      
      // Latest articles
      ApiService.fetchArticles({ per_page: 6, orderby: 'date' }),
      
      // highlight
      ApiService.fetchArticles({ tags: [39], per_page: 15, orderby: 'date' }),
      
      // Africa category articles (adjust category slug as needed)
      ApiService.fetchArticles({ categories: [25], per_page: 11 }),
      
      // Entertainment articles
      ApiService.fetchArticles({ categories: [7], per_page: 11 }),

    ])

    return {
      categories: categories.status === 'fulfilled' ? categories.value : [],
      featuredArticles: featuredResponse.status === 'fulfilled' ? featuredResponse.value.data : [],
      popularArticles: popularArticles.status === 'fulfilled' ? popularArticles.value : [],
      latestArticles: latestResponse.status === 'fulfilled' ? latestResponse.value.data : [],
      africaArticles: africaResponse.status === 'fulfilled' && africaResponse.value ? africaResponse.value.data : [],
      EntertainmentArticles: entertainmentResponse.status === 'fulfilled' && entertainmentResponse.value ? entertainmentResponse.value.data : [],
      highlightTagArticles: highlightResponse.status === 'fulfilled' ? highlightResponse.value.data : [],
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
    }
  }
}

export async function prefetchHomeDataWithCache(revalidate: number = 300) {
  const data = await prefetchHomeData()
  
  return {
    data,
    revalidate // Revalidate every 5 minutes (300 seconds)
  }
}