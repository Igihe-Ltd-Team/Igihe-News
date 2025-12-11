import { ApiService } from '@/services/apiService'
import { Advertisement, Category, NewsItem } from '@/types/fetchData'

export interface HomePageData {
  liveEvent:NewsItem[],
  topSliders: NewsItem[]
  // categories: Category[]
  featuredArticles: NewsItem[]
  popularArticles: NewsItem[]
  highlightTagArticles: NewsItem[]
  prefetchedAdds:Advertisement[] 
  // latestArticles: NewsItem[]
  // africaArticles: NewsItem[]
  // EntertainmentArticles: NewsItem[]
}

export async function prefetchHomeData(): Promise<HomePageData> {
  try {
    // Fetch all data in parallel for maximum performance
    const [
      liveEventResponse,
      topSlidersResponse,
      // categories,
      featuredResponse,
      popularArticles,
      // latestResponse,
      highlightResponse,
      addsResponse
      // africaResponse,
      // entertainmentResponse,
    ] = await Promise.allSettled([
      // Featured articles
      ApiService.fetchArticles({ tags: [199], per_page: 1 }),
      ApiService.fetchArticles({ tags: [198], per_page: 9 }),
      // Categories
      // ApiService.fetchCategories({ per_page: 100 }),
      
      // Featured articles
      ApiService.fetchArticles({ tags: [63], per_page: 8 }),
      // Popular articles
      ApiService.fetchMostPopularArticlesFallback({ period: 'week', per_page: 5 }),
      
      // Latest articles
      // ApiService.fetchArticles({ per_page: 6, orderby: 'date' }),
      
      // highlight
      ApiService.fetchArticles({ tags: [64], per_page: 11, orderby: 'date' }),

      
      // Africa category articles (adjust category slug as needed)
      // ApiService.fetchArticles({ categories: [25], per_page: 11 }),
      
      // Entertainment articles
      // ApiService.fetchArticles({ categories: [7], per_page: 11 }),
      ApiService.fetchAdvertisements()
    ])

    return {
      liveEvent:liveEventResponse.status === 'fulfilled' ? liveEventResponse.value.data : [],
      topSliders: topSlidersResponse.status === 'fulfilled' ? topSlidersResponse.value.data : [],
      // categories: categories.status === 'fulfilled' ? categories.value : [],
      featuredArticles: featuredResponse.status === 'fulfilled' ? featuredResponse.value.data : [],
      popularArticles: popularArticles.status === 'fulfilled' ? popularArticles.value : [],
      // latestArticles: latestResponse.status === 'fulfilled' ? latestResponse.value.data : [],
      // africaArticles: africaResponse.status === 'fulfilled' && africaResponse.value ? africaResponse.value.data : [],
      // EntertainmentArticles: entertainmentResponse.status === 'fulfilled' && entertainmentResponse.value ? entertainmentResponse.value.data : [],
      highlightTagArticles: highlightResponse.status === 'fulfilled' ? highlightResponse.value.data : [],
      prefetchedAdds:addsResponse.status === 'fulfilled' ? addsResponse.value : []
    }
  } catch (error) {
    console.error('Error prefetching home data:', error)
    
    // Return empty data structure on error
    return {
      liveEvent:[],
      topSliders:[],
      // categories: [],
      featuredArticles: [],
      popularArticles: [],
      highlightTagArticles: [],
      prefetchedAdds:[]
      // latestArticles: [],
      // africaArticles: [],
      // EntertainmentArticles: [],
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