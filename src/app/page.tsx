import { ApiService } from '@/services/apiService'
import { Home } from './home/home'
import { PrefetchHomeData } from './prefetch-home-data'

// This will be automatically cached and deduped by React
async function getHomeData() {
  try {
    const [categories, featuredArticles, videos, breakingNews] = await Promise.all([
      ApiService.fetchCategories({ per_page: 100 }),
      ApiService.fetchArticles({ per_page: 15 }),
      ApiService.fetchVideos({ per_page: 21 }),
      ApiService.fetchArticles({ 
        categories: [1], // Breaking news category
        per_page: 5 
      }),
    ])

    return {
      categories,
      featuredArticles,
      videos,
      breakingNews,
    }
  } catch (error) {
    console.error('Error fetching home data:', error)
    return {
      categories: [],
      featuredArticles: { data: [], pagination: { currentPage: 1, totalPages: 0, hasNextPage: false } },
      videos: [],
      breakingNews: { data: [], pagination: { currentPage: 1, totalPages: 0, hasNextPage: false } },
    }
  }
}

export default async function HomePage() {
  const homeData = await getHomeData()

  return (
    <PrefetchHomeData initialData={homeData}>
      <Home />
    </PrefetchHomeData>
  )
}