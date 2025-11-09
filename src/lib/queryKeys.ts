export const queryKeys = {
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.categories.details(), id] as const,
  },
  articles: {
    all: ['articles'] as const,
    lists: () => [...queryKeys.articles.all, 'list'] as const,
    details: () => [...queryKeys.articles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.articles.details(), id] as const,
    list: (filters: any) => [...queryKeys.articles.lists(), filters] as const,
    infinite: (filters: any) => [...queryKeys.articles.lists(), 'infinite', filters] as const,
    related: (postId: string, categoryId?: number) => 
      [...queryKeys.articles.all, 'related', postId, categoryId] as const,
    byAuthorSlug: (slug: string, params?: any) => 
      [...queryKeys.articles.all, 'byAuthorSlug', slug, params] as const,
    byCategorySlug: (slug: string, params?: any) => 
      [...queryKeys.articles.all, 'byCategorySlug', slug, params] as const,
  },



  videos: {
    all: ['videos'] as const,
    lists: () => [...queryKeys.videos.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.videos.lists(), filters] as const,
  },
  search: {
    all: ['search'] as const,
    query: (query: string, filters?: any) => [...queryKeys.search.all, query, filters] as const,
  },
  ai: {
    summaries: (articleId: string) => ['ai', 'summaries', articleId] as const,
    keyPoints: (articleId: string) => ['ai', 'keyPoints', articleId] as const,
    recommendations: ['ai', 'recommendations'] as const,
    dailyDigest: ['ai', 'dailyDigest'] as const,
  },
  authors: {
    all: ['authors'] as const,
    lists: (filters?: any) => [...queryKeys.authors.all, 'list', filters] as const,
    detail: (slug: string) => {
      if (!slug) throw new Error('Slug is required for author detail')
      return [...queryKeys.authors.all, 'detail', slug] as const
    },
    byId: (id: number) => [...queryKeys.authors.all, 'byId', id] as const,
    popular: (limit: number) => [...queryKeys.authors.all, 'popular', limit] as const,
    withPosts: (limit: number) => [...queryKeys.authors.all, 'withPosts', limit] as const,
  },

  ads: {
    all: ['ads'] as const,
    lists: () => [...queryKeys.ads.all, 'list'] as const,
    byPosition: (position: string) => [...queryKeys.ads.all, 'position', position] as const,
    byPositions: (positions: string[]) => [...queryKeys.ads.all, 'positions', ...positions] as const,
  },

  
} as const