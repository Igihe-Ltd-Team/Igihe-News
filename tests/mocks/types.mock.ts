export interface NewsItem {
  id: number
  slug: string
  title: { rendered: string }
  content: { rendered: string }
  date: string
  modified: string
  categories: number[]
  tags: number[]
  featured_media: number
  comment_count: number
  _embedded?: Record<string, any>
  acf?: Record<string, any>
}

export interface TraficNews {
  id: number
  slug: string
  title: string
  date: string
  views: number
}

export interface Category {
  id: number
  name: string
  slug: string
  count: number
  description: string
}

export interface Author {
  id: number
  name: string
  slug: string
  description: string
  avatar_urls: Record<string, string>
}

export interface Advertisement {
  id: number
  acf: { position: string; image: string; link: string }
}

export interface articleResponse<T> {
  data: T[]
  pagination: {
    currentPage: number
    perPage: number
    totalPages: number
    totalItems: number
    hasNextPage: boolean
  }
}

export interface CategoryPostsResponse {
  posts: articleResponse<NewsItem>
  category: Category
}