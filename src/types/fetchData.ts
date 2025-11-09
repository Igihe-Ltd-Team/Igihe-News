export interface PaginationInfo {
  currentPage: number
  perPage: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
}

export interface articleResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

export interface ApiError {
  message: string
  status: number
  code: string
}

// types/news.ts
export interface Category {
  id: number
  name: string
  slug: string
  count: number
  description?: string
}

export interface NewsItem {
  id: string
  date: string
  date_gmt: string
  guid: {
    rendered: string
  }
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: 'post' | 'igh-yt-videos'
  link: string
  title: {
    rendered: string
  }
  content?: {
    rendered: string
    protected: boolean
  }
  excerpt?: {
    rendered: string
    protected: boolean
  }
  author?: number
  featured_media: number
  categories?: number[]
  tags?: number[]
  comment_count?: number
  acf?: {
    igh_yt_video_url?: string
    igh_yt_video_url_source?: {
      label: string
      type: string
      formatted_value: string
    }
  }
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      id: number
      source_url: string
      media_details?: {
        width: number
        height: number
        sizes: {
          medium?: { source_url: string }
          large?: { source_url: string }
          thumbnail?: { source_url: string }
          medium_large?: { source_url: string }
          full?: { source_url: string }
        }
      }
    }>
    'wp:term'?: Array<Array<{
      id: number
      name: string
      slug: string
      taxonomy: string
    }>>
    author?: Array<{
      id: number
      name: string
      avatar_urls: {
        24: string
        48: string
        96: string
      }
    }>
  }
}


export interface Author {
  id: number
  name: string
  url: string
  description: string
  link: string
  slug: string
  avatar_urls: {
    '24': string
    '48': string
    '96': string
  }
  meta: any[]
  acf: any[]
  _links: {
    self: Array<{ href: string }>
    collection: Array<{ href: string }>
  }
  // WordPress user fields
  post_count?: number
  registered_date?: string
  roles?: string[]
  capabilities?: Record<string, boolean>
  extra_capabilities?: Record<string, boolean>
}

// Extended author with posts
export interface AuthorWithPosts extends Author {
  recent_posts: NewsItem[]
  total_posts: number
}