import { Category, CategoryPostsResponse, NewsItem } from '@/types/fetchData'
import { API_CONFIG, fetchWithTimeout, buildQuery } from './apiClient'
import { cachedRequest } from './cacheManager'
import { fetchArticles } from './articleService'

// ─── Category Fetching ───────────────────────────────────────────────────────

export async function fetchCategories(params?: {
  per_page?: number
  orderby?: string
  exclude?: number[]
}): Promise<Category[]> {
  const cacheKey = `categories:${params?.per_page ?? 100}:${params?.orderby ?? 'count'}:${params?.exclude?.join(',') ?? ''}`

  return cachedRequest({
    key: cacheKey,
    fetchFn: async () => {
      const queryParams: Record<string, any> = {
        per_page: params?.per_page || 100,
        _fields: 'id,name,slug,count,description',
        orderby: params?.orderby || 'count',
        order: 'desc',
      }

      if (params?.exclude?.length) {
        queryParams.exclude = params.exclude.join(',')
      }

      const qs = buildQuery(queryParams)
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/categories?${qs}`)
      const data = await response.json()
      return data.filter((cat: Category) => cat.count > 0)
    },
    ttl: 120 * 60 * 1000, // 2 hours
  })
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  const response = await fetchWithTimeout(
    `${API_CONFIG.baseURL}/categories?slug=${slug}&_embed`
  )
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  const categories = await response.json()
  return categories[0] || null
}

export async function fetchPostsByCategorySlug(
  slug: string,
  params?: {
    per_page?: number
    page?: number
    orderby?: 'date' | 'modified' | 'title' | 'comment_count'
    order?: 'asc' | 'desc'
  }
): Promise<CategoryPostsResponse | null> {
  try {
    const category = await fetchCategoryBySlug(slug)
    if (!category) return null

    const postsResponse = await fetchArticles({
      categories: [category.id],
      ...params,
    })

    return { posts: postsResponse, category }
  } catch (error) {
    console.error('Error fetching posts by category slug:', error)
    return null
  }
}

export async function fetchPopularCategories(limit = 10): Promise<Category[]> {
  try {
    const categories = await fetchCategories({ per_page: limit, orderby: 'count' })
    return categories.filter(c => c.count > 0)
  } catch (error) {
    console.error('Error fetching popular categories:', error)
    return []
  }
}

export async function fetchCategoriesWithPosts(
  limit = 20
): Promise<Array<Category & { recent_posts: NewsItem[] }>> {
  try {
    const categories = await fetchPopularCategories(limit)

    return Promise.all(
      categories.map(async (category) => {
        try {
          const postsResponse = await fetchArticles({
            categories: [category.id],
            per_page: 5,
            orderby: 'date',
            order: 'desc',
          })
          return { ...category, recent_posts: postsResponse.data || [] }
        } catch {
          return { ...category, recent_posts: [] }
        }
      })
    )
  } catch (error) {
    console.error('Error fetching categories with posts:', error)
    return []
  }
}
