// import { ApiService } from '@/services/apiService'
// import { Advertisement, Category, NewsItem } from '@/types/fetchData'

// export interface HomePageData {
//   liveEvent:NewsItem[],
//   mainArticle:NewsItem[]
//   topSliders: NewsItem[]
//   // categories: Category[]
//   featuredArticles: NewsItem[]
//   popularArticles: NewsItem[]
//   highlightTagArticles: NewsItem[]
//   prefetchedAdds:Advertisement[] 
//   // latestArticles: NewsItem[]
//   // africaArticles: NewsItem[]
//   // EntertainmentArticles: NewsItem[]
// }

// export async function prefetchHomeData(): Promise<HomePageData> {
//   try {
//     // Fetch all data in parallel for maximum performance
//     const [
//       liveEventResponse,
//       mainArticleResponse,
//       topSlidersResponse,
//       // categories,
//       featuredResponse,
//       popularArticles,
//       // latestResponse,
//       highlightResponse,
//       addsResponse
//       // africaResponse,
//       // entertainmentResponse,
//     ] = await Promise.allSettled([
//       // Featured articles
//       ApiService.fetchArticles({ tags: [199], per_page: 1 }),
//       ApiService.fetchArticles({ tags: [197], per_page: 1 }),
//       ApiService.fetchArticles({ tags: [198], per_page: 9 }),
//       // Categories
//       // ApiService.fetchCategories({ per_page: 100 }),
      
//       // Featured articles
//       ApiService.fetchArticles({ tags: [63], per_page: 8 }),
//       // Popular articles
//       ApiService.fetchMostPopularArticlesFallback({ period: 'week', per_page: 5 }),
      
//       // Latest articles
//       // ApiService.fetchArticles({ per_page: 6, orderby: 'date' }),
      
//       // highlight
//       ApiService.fetchArticles({ tags: [64], per_page: 11, orderby: 'date' }),

      
//       // Africa category articles (adjust category slug as needed)
//       // ApiService.fetchArticles({ categories: [25], per_page: 11 }),
      
//       // Entertainment articles
//       // ApiService.fetchArticles({ categories: [7], per_page: 11 }),
//       ApiService.fetchAdvertisements()
//     ])

//     return {
//       liveEvent:liveEventResponse.status === 'fulfilled' ? liveEventResponse.value.data : [],
//       mainArticle:mainArticleResponse.status === 'fulfilled' ? mainArticleResponse.value.data : [],
//       topSliders: topSlidersResponse.status === 'fulfilled' ? topSlidersResponse.value.data : [],
//       // categories: categories.status === 'fulfilled' ? categories.value : [],
//       featuredArticles: featuredResponse.status === 'fulfilled' ? featuredResponse.value.data : [],
//       popularArticles: popularArticles.status === 'fulfilled' ? popularArticles.value : [],
//       // latestArticles: latestResponse.status === 'fulfilled' ? latestResponse.value.data : [],
//       // africaArticles: africaResponse.status === 'fulfilled' && africaResponse.value ? africaResponse.value.data : [],
//       // EntertainmentArticles: entertainmentResponse.status === 'fulfilled' && entertainmentResponse.value ? entertainmentResponse.value.data : [],
//       highlightTagArticles: highlightResponse.status === 'fulfilled' ? highlightResponse.value.data : [],
//       prefetchedAdds:addsResponse.status === 'fulfilled' ? addsResponse.value : []
//     }
//   } catch (error) {
//     console.error('Error prefetching home data:', error)
    
//     // Return empty data structure on error
//     return {
//       liveEvent:[],
//       mainArticle:[],
//       topSliders:[],
//       // categories: [],
//       featuredArticles: [],
//       popularArticles: [],
//       highlightTagArticles: [],
//       prefetchedAdds:[]
//       // latestArticles: [],
//       // africaArticles: [],
//       // EntertainmentArticles: [],
//     }
//   }
// }

// export async function prefetchHomeDataWithCache(revalidate: number = 300) {
//   const data = await prefetchHomeData()
  
//   return {
//     data,
//     revalidate // Revalidate every 5 minutes (300 seconds)
//   }
// }




import { ApiService } from '@/services/apiService'
import { Advertisement, NewsItem } from '@/types/fetchData'

export interface HomePageData {
  liveEvent: NewsItem[]
  mainArticle: NewsItem[]
  topSliders: NewsItem[]
  featuredArticles: NewsItem[]
  popularArticles: NewsItem[]
  highlightTagArticles: NewsItem[]
  prefetchedAdds: Advertisement[]
}

// Add type for below-fold data
export interface BelowFoldData {
  latestArticles: NewsItem[]
  africaArticles: NewsItem[]
  entertainmentArticles: NewsItem[]
  featuredAdvertorial: any[]
  featuredAnnouncement: any[]
}

// Combined type for full data
export type ExtendedHomePageData = HomePageData & BelowFoldData

/**
 * Prefetch critical above-the-fold data
 * This runs on the server and blocks page render
 */
export async function prefetchHomeData(): Promise<HomePageData> {
  try {
    // Only fetch CRITICAL above-the-fold content
    const [
      liveEventResponse,
      mainArticleResponse,
      topSlidersResponse,
      featuredResponse,
      popularArticles,
      highlightResponse,
      addsResponse
    ] = await Promise.allSettled([
      ApiService.fetchArticles({ tags: [199], per_page: 1 }),
      ApiService.fetchArticles({ tags: [197], per_page: 1 }),
      ApiService.fetchArticles({ tags: [198], per_page: 9 }),
      ApiService.fetchArticles({ tags: [63], per_page: 8 }),
      ApiService.fetchMostPopularArticlesFallback({ period: 'week', per_page: 5 }),
      ApiService.fetchArticles({ tags: [64], per_page: 11, orderby: 'date' }),
      ApiService.fetchAdvertisements()
    ])

    return {
      liveEvent: liveEventResponse.status === 'fulfilled' ? liveEventResponse.value.data : [],
      mainArticle: mainArticleResponse.status === 'fulfilled' ? mainArticleResponse.value.data : [],
      topSliders: topSlidersResponse.status === 'fulfilled' ? topSlidersResponse.value.data : [],
      featuredArticles: featuredResponse.status === 'fulfilled' ? featuredResponse.value.data : [],
      popularArticles: popularArticles.status === 'fulfilled' ? popularArticles.value : [],
      highlightTagArticles: highlightResponse.status === 'fulfilled' ? highlightResponse.value.data : [],
      prefetchedAdds: addsResponse.status === 'fulfilled' ? addsResponse.value : []
    }
  } catch (error) {
    console.error('Error prefetching home data:', error)
    return {
      liveEvent: [],
      mainArticle: [],
      topSliders: [],
      featuredArticles: [],
      popularArticles: [],
      highlightTagArticles: [],
      prefetchedAdds: []
    }
  }
}

/**
 * Prefetch below-the-fold data (non-blocking)
 * This data can load after initial render
 */
export async function prefetchBelowFoldData() {
  try {
    const [
      latestResponse,
      africaResponse,
      entertainmentResponse,
      advertorialResponse,
      opinionsResponse,
      announcementResponse
    ] = await Promise.allSettled([
      ApiService.fetchArticles({ per_page: 6, orderby: 'date' }),
      ApiService.fetchArticles({ tags: [120], per_page: 12 }),
      ApiService.fetchArticles({ categories: [105, 123], per_page: 12 }),
      ApiService.fetchAdvertorals(),
      ApiService.fetchOpinions(),
      ApiService.fetchAnnouncement()
    ])

    return {
      latestArticles: latestResponse.status === 'fulfilled' ? latestResponse.value.data : [],
      africaArticles: africaResponse.status === 'fulfilled' ? africaResponse.value.data : [],
      entertainmentArticles: entertainmentResponse.status === 'fulfilled' ? entertainmentResponse.value.data : [],
      featuredAdvertorial: advertorialResponse.status === 'fulfilled' ? advertorialResponse.value : [],
      featuredOpinions: opinionsResponse.status === 'fulfilled' ? opinionsResponse.value : [],
      featuredAnnouncement: announcementResponse.status === 'fulfilled' ? announcementResponse.value : []
    }
  } catch (error) {
    console.error('Error prefetching below-fold data:', error)
    return {
      latestArticles: [],
      africaArticles: [],
      entertainmentArticles: [],
      featuredAdvertorial: [],
      featuredOpinions: [],
      featuredAnnouncement: []
    }
  }
}

/**
 * Prefetch ALL data (for static generation or full SSR)
 */
export async function prefetchAllHomeData(): Promise<ExtendedHomePageData> {
  const [criticalData, belowFoldData] = await Promise.all([
    prefetchHomeData(),
    prefetchBelowFoldData()
  ])

  return {
    ...criticalData,
    ...belowFoldData
  }
}