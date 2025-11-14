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
  // breakingNews: NewsItem[]
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
      ApiService.fetchArticles({ categories: [25], per_page: 11 }),
      
      // Entertainment articles
      ApiService.fetchArticles({ categories: [7], per_page: 11 }),

      // ApiService.fetchAdvertorals(),
      // ApiService.fetchAnnouncement()
    ])

    return {
      categories: categories.status === 'fulfilled' ? categories.value : [],
      featuredArticles: featuredResponse.status === 'fulfilled' ? featuredResponse.value.data : [],
      popularArticles: popularArticles.status === 'fulfilled' ? popularArticles.value : [],
      latestArticles: latestResponse.status === 'fulfilled' ? latestResponse.value.data : [],
      videos: videos.status === 'fulfilled' ? videos.value : [],
      // breakingNews: breakingResponse.status === 'fulfilled' ? breakingResponse.value.data : [],
      africaArticles: africaResponse.status === 'fulfilled' && africaResponse.value ? africaResponse.value.data : [],
      EntertainmentArticles: entertainmentResponse.status === 'fulfilled' && entertainmentResponse.value ? entertainmentResponse.value.data : [],
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
      // breakingNews: []
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


// lib/prefetch-home-data.ts
// import { ApiService } from '@/services/apiService'
// import { Category, NewsItem } from '@/types/fetchData'

// export interface HomePageData {
//   categories: Category[]
//   featuredArticles: NewsItem[]
//   popularArticles: NewsItem[]
//   highlightTagArticles: NewsItem[]
//   latestArticles: NewsItem[]
//   africaArticles: NewsItem[]
//   entertainmentArticles: NewsItem[]
//   videos: NewsItem[]
//   breakingNews: NewsItem[]
// }

// // Cache keys for reuse
// const CACHE_TAGS = {
//   featured: 'featured-tag-31',
//   highlight: 'highlight-tag-39',
//   africa: 'category-25',
//   entertainment: 'category-7',
// }

// export async function prefetchHomeData(): Promise<HomePageData> {
//   try {
//     // Parallel fetch with proper caching + revalidation
//     const [
//       categories,
//       featuredResp,
//       popularArticles,
//       latestResp,
//       videos,
//       highlightResp,
//       africaResp,
//       entertainmentResp,
//     ] = await Promise.all([
//       // 1. Categories
//       ApiService.fetchCategories({ per_page: 100 }).catch(() => []),

//       // 2. Featured (tag 31)
//       ApiService.fetchArticles({
//         tags: [31],
//         per_page: 20,
//       }).catch(() => ({ data: [] as NewsItem[] })),

//       // 3. Popular
//       ApiService.fetchMostPopularArticles({ period: 'week', per_page: 10 }).catch(() => [] as NewsItem[]),

//       // 4. Latest
//       ApiService.fetchArticles({ per_page: 6, orderby: 'date' }).catch(() => ({ data: [] as NewsItem[] })),

//       // 5. Videos
//       ApiService.fetchVideos({ per_page: 21 }).catch(() => [] as NewsItem[]),

//       // 6. Highlight (tag 39)
//       ApiService.fetchArticles({
//         tags: [39],
//         per_page: 15,
//         orderby: 'date',
//       }).catch(() => ({ data: [] as NewsItem[] })),

//       // 7. Africa (category 25)
//       ApiService.fetchArticles({
//         categories: [25],
//         per_page: 11,
//       }).catch(() => ({ data: [] as NewsItem[] })),

//       // 8. Entertainment (category 7)
//       ApiService.fetchArticles({
//         categories: [7],
//         per_page: 11,
//       }).catch(() => ({ data: [] as NewsItem[] })),
//     ])

//     // Build final data
//     const data: HomePageData = {
//       categories: categories ?? [],
//       featuredArticles: featuredResp.data ?? [],
//       popularArticles: popularArticles ?? [],
//       latestArticles: latestResp.data ?? [],
//       videos: videos ?? [],
//       breakingNews: latestResp.data.slice(0, 5), // Reuse latest as breaking
//       africaArticles: africaResp.data ?? [],
//       entertainmentArticles: entertainmentResp.data ?? [],
//       highlightTagArticles: highlightResp.data ?? [],
//     }

//     return data
//   } catch (error) {
//     console.error('prefetchHomeData failed:', error)

//     // Graceful fallback — never crash the page
//     return {
//       categories: [],
//       featuredArticles: [],
//       popularArticles: [],
//       highlightTagArticles: [],
//       latestArticles: [],
//       africaArticles: [],
//       entertainmentArticles: [],
//       videos: [],
//       breakingNews: [],
//     }
//   }
// }

// // For ISR + revalidation
// export async function prefetchHomeDataWithCache(revalidateSeconds: number = 60) {
//   const data = await prefetchHomeData()

//   return {
//     props: { initialData: data },
//     revalidate: revalidateSeconds,
//   }
// }