export interface PaginationInfo {
  currentPage: number
  perPage: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  totalPosts?: number
  hasPrevPage?: boolean
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



export interface Tag {
  id: number
  name: string
  slug: string
  description?: string
  count?: number
}


// types/fetchData.ts
export interface NewsItem {
  id: number
  date: string
  date_gmt: string
  guid: {
    rendered: string
  }
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  excerpt: {
    rendered: string
    protected: boolean
  }
  author: number
  featured_media: number
  comment_status: string
  ping_status: string
  sticky: boolean
  template: string
  format: string
  meta: {
    _acf_changed: boolean
    footnotes: string
  }
  categories: Category[]
  tags: Tag[]
  class_list: string[]
  acf: any[]
  _links: {
    self: Array<{ href: string }>
    collection: Array<{ href: string }>
    about: Array<{ href: string }>
    author: Array<{ embeddable: boolean; href: string }>
    replies: Array<{ embeddable: boolean; href: string }>
    'version-history': Array<{ count: number; href: string }>
    'predecessor-version': Array<{ id: number; href: string }>
    'wp:featuredmedia': Array<{ embeddable: boolean; href: string }>
    'wp:attachment': Array<{ href: string }>
    'wp:term': Array<{ taxonomy: string; embeddable: boolean; href: string }>
    curies: Array<{ name: string; href: string; templated: boolean }>
  }

  _embedded?: {
    author?: Array<{
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
    }>
    'wp:featuredmedia'?: Array<{
      id: number
      date: string
      slug: string
      type: string
      link: string
      title: {
        rendered: string
      }
      author: number
      caption: {
        rendered: string
      }
      alt_text: string
      media_type: string
      mime_type: string
      media_details: {
        width: number
        height: number
        file: string
        sizes: {
          [key: string]: {
            file: string
            width: number
            height: number
            mime_type: string
            source_url: string
          }
        }
      }
      source_url: string
      _links: any
    }>
    'wp:term'?: Array<Array<{
      id: number
      link: string
      name: string
      slug: string
      taxonomy: string
      _links: any
    }>>
  }
  
  // SEO fields (might not exist in all posts)
  seo_title?: string
  meta_description?: string
  yoast_head_json?: {
    title?: string
    description?: string
    canonical?: string
    og_title?: string
    og_description?: string
    og_image?: Array<{
      url: string
      width: number
      height: number
    }>
    twitter_title?: string
    twitter_description?: string
    twitter_image?: string
  }
}

// Extended interface with guaranteed SEO fields
export interface NewsItemWithSEO extends NewsItem {
  seo_title: string
  meta_description: string
  yoast_head_json: {
    title: string
    description: string
    canonical: string
    og_title: string
    og_description: string
    og_image?: Array<{
      url: string
      width: number
      height: number
    }>
    twitter_title: string
    twitter_description: string
    twitter_image?: string
  }
}



export interface Author {
  id: number
  name: string
  url: string
  description: string
  link: string
  slug: string
  avatar_urls?: {
    '24': string
    '48': string
    '96': string
    '512'?: string // Make 512 optional since it might not exist
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



export interface Advertisement {
  id: number
  slug: string
  title: {
    rendered: string
  }
  menu_order: number
  class_list: string[]
  acf: {
    ads_image: number
    ads_image_source: {
      formatted_value: {
        url: string
        width: number
        height: number
        sizes?: {
          thumbnail?: string
          medium?: string
          large?: string
          '1536x1536'?: string
          '2048x2048'?: string
        }
      }
    }
    igh_ad_url: string
    ad_position: number[]
  }
  link: string
}

export interface AdPosition {
  id: string
  name: string
  ads: Advertisement[]
}