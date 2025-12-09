import { queryKeys } from '@/lib/queryKeys'
import { queryClient } from '@/lib/react-query'
import { ApiService } from '@/services/apiService'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

export async function prefetchCategories() {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: () => ApiService.fetchCategories({ per_page: 100 }),
  })
}

export async function prefetchFeaturedArticles() {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.articles.list({ featured: true }),
    queryFn: () => ApiService.fetchArticles({ tags: [64], per_page: 20 }),
  })
}

export async function prefetchCategoryArticles(categoryId: number) {
  await queryClient.prefetchQuery({
    queryKey: queryKeys.articles.list({ categories: [categoryId] }),
    queryFn: () => ApiService.fetchArticles({ 
      categories: [categoryId], 
      per_page: 20 
    }),
  })
}

// Server component wrapper
// export async function PrefetchedHomepage() {
//   await Promise.all([
//     prefetchCategories(),
//     prefetchFeaturedArticles(),
//   ])

//   return (
//     <HydrationBoundary state={dehydrate(queryClient)}>
//       <HomepageClient />
//     </HydrationBoundary>
//   )
// }