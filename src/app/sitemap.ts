// // src/app/sitemap.ts
// import { MetadataRoute } from 'next'
// import { ApiService } from '@/services/apiService'
// import { Category } from '@/types/fetchData'

// // Base URL configuration
// const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://en.igihe.com'

// export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
//   try {
//     // Fetch all dynamic data in parallel
//     const [categories, allPosts, allVideos, allAuthors, allTags] = await Promise.all([
//       fetchCategories(),
//       fetchAllPosts(),
//       fetchAllVideos(),
//       fetchAllAuthors(),
//       fetchAllTags(),
//     ])

//     const sitemapEntries: MetadataRoute.Sitemap = []

//     // 1. Static Pages
//     sitemapEntries.push(
//       {
//         url: BASE_URL,
//         lastModified: new Date(),
//         changeFrequency: 'hourly',
//         priority: 1.0,
//       },
//       {
//         url: `${BASE_URL}/articles`,
//         lastModified: new Date(),
//         changeFrequency: 'hourly',
//         priority: 0.9,
//       },
//       {
//         url: `${BASE_URL}/videos`,
//         lastModified: new Date(),
//         changeFrequency: 'daily',
//         priority: 0.8,
//       },
//       {
//         url: `${BASE_URL}/opinion`,
//         lastModified: new Date(),
//         changeFrequency: 'daily',
//         priority: 0.8,
//       },
//       {
//         url: `${BASE_URL}/advertorials`,
//         lastModified: new Date(),
//         changeFrequency: 'weekly',
//         priority: 0.6,
//       },
//       {
//         url: `${BASE_URL}/announcements`,
//         lastModified: new Date(),
//         changeFrequency: 'daily',
//         priority: 0.7,
//       },
//       {
//         url: `${BASE_URL}/author`,
//         lastModified: new Date(),
//         changeFrequency: 'weekly',
//         priority: 0.6,
//       },
//       {
//         url: `${BASE_URL}/services`,
//         lastModified: new Date(),
//         changeFrequency: 'weekly',
//         priority: 0.6,
//       }
//     )

//     // 2. Category Pages
//     sitemapEntries.push(...categories.map(category => ({
//       url: `${BASE_URL}/${category.slug}`,
//       lastModified: new Date(),
//       changeFrequency: 'daily' as const,
//       priority: 0.9,
//     })))

//     // 3. Article Pages
//     sitemapEntries.push(...allPosts.map(post => ({
//       url: `${BASE_URL}/${post.categorySlug}/article/${post.slug}`,
//       lastModified: post.modified || post.date || new Date(),
//       changeFrequency: 'weekly' as const,
//       priority: post.categorySlug === 'news' ? 0.8 : 0.7,
//     })))

//     // 4. Video Pages
//     sitemapEntries.push(...allVideos.map(video => ({
//       url: `${BASE_URL}/videos/${video.slug}`,
//       lastModified: video.date || new Date(),
//       changeFrequency: 'monthly' as const,
//       priority: 0.6,
//     })))

//     // 5. Author Pages
//     sitemapEntries.push(...allAuthors.map(author => ({
//       url: `${BASE_URL}/author/${author.slug}`,
//       lastModified: new Date(),
//       changeFrequency: 'weekly' as const,
//       priority: 0.5,
//     })))

//     // 6. Tag Pages
//     sitemapEntries.push(...allTags.map(tag => ({
//       url: `${BASE_URL}/tag/${tag.slug}`,
//       lastModified: new Date(),
//       changeFrequency: 'weekly' as const,
//       priority: 0.4,
//     })))

//     return sitemapEntries
//   } catch (error) {
//     console.error('❌ Sitemap generation error:', error)
//     // Return at least the static pages if there's an error
//     return [
//       {
//         url: BASE_URL,
//         lastModified: new Date(),
//         changeFrequency: 'daily',
//         priority: 1.0,
//       }
//     ]
//   }
// }

// // Helper function to fetch all categories
// async function fetchCategories(): Promise<Category[]> {
//   try {
//     const { prefetchAllHomeData } = await import("@/lib/prefetch-home-data")
//     const data = await prefetchAllHomeData()
//     return data.categories || []
//   } catch (error) {
//     console.error('Error fetching categories:', error)
//     return []
//   }
// }

// // Helper function to fetch all posts (with pagination)
// async function fetchAllPosts(): Promise<Array<{
//   slug: string
//   categorySlug: string
//   date?: Date
//   modified?: Date
// }>> {
//   try {
//     const posts: Array<any> = []
//     let page = 1
//     let hasMore = true
//     const MAX_PAGES = 10 // Limit to prevent infinite loops during build

//     while (hasMore && page <= MAX_PAGES) {
//       try {
//         const response = await ApiService.fetchArticles({
//           page,
//           per_page: 100
//         })

//         if (response?.data && Array.isArray(response.data)) {
//           const postsWithCategory = await Promise.all(
//             response.data.map(async (post: any) => {
//               let categorySlug = 'news' // default
              
//               if (post.categories && post.categories.length > 0) {
//                 try {
//                   const categoryData = await ApiService.fetchCategoryById(post.categories[0])
//                   categorySlug = categoryData?.slug || 'news'
//                 } catch (error) {
//                   console.warn(`Could not fetch category for post ${post.slug}`)
//                 }
//               }

//               return {
//                 slug: post.slug,
//                 categorySlug,
//                 date: post.date ? new Date(post.date) : undefined,
//                 modified: post.modified ? new Date(post.modified) : undefined
//               }
//             })
//           )

//           posts.push(...postsWithCategory)
//         }

//         // Check if there are more pages
//         const totalPages = response?.pagination?.totalPages || 0
//         hasMore = page < totalPages
//         page++
//       } catch (error) {
//         console.error(`Error fetching posts page ${page}:`, error)
//         hasMore = false
//       }
//     }

//     // Also fetch special category posts
//     const specialCategories = ['opinion', 'advertorial', 'facts', 'announcement']
//     for (const category of specialCategories) {
//       try {
//         const specialPosts = await fetchSpecialCategoryPosts(category)
//         posts.push(...specialPosts)
//       } catch (error) {
//         console.error(`Error fetching special category ${category}:`, error)
//       }
//     }

//     // Remove duplicates based on slug
//     const uniquePosts = Array.from(
//       new Map(posts.map(post => [`${post.categorySlug}-${post.slug}`, post])).values()
//     )

//     return uniquePosts
//   } catch (error) {
//     console.error('Error fetching all posts:', error)
//     return []
//   }
// }

// // Helper function for special categories
// async function fetchSpecialCategoryPosts(endpoint: string): Promise<Array<any>> {
//   try {
//     const response = await ApiService.customPostFetch(`${endpoint}?per_page=100`, '')
    
//     if (response && Array.isArray(response)) {
//       return response.map((post: any) => {
//         let categorySlug = endpoint
//         if (endpoint === 'opinion') categorySlug = 'opinion'
//         if (endpoint === 'advertorial') categorySlug = 'advertorials'
//         if (endpoint === 'facts') categorySlug = 'facts'
//         if (endpoint === 'announcement') categorySlug = 'announcements'

//         return {
//           slug: post.slug,
//           categorySlug,
//           date: post.date ? new Date(post.date) : undefined,
//           modified: post.modified ? new Date(post.modified) : undefined
//         }
//       })
//     }
//     return []
//   } catch (error) {
//     console.error(`Error fetching special category ${endpoint}:`, error)
//     return []
//   }
// }

// // Helper function to fetch all videos
// async function fetchAllVideos(): Promise<Array<{ slug: string; date?: Date }>> {
//   try {
//     const videos: Array<any> = []
//     let page = 1
//     let hasMore = true
//     const MAX_PAGES = 5

//     // while (hasMore && page <= MAX_PAGES) {
//       try {
//         const response = await ApiService.fetchVideos({
//           page,
//           per_page: 30,
//         })

//         if (response && Array.isArray(response)) {
//           videos.push(...response.map((video: any) => ({
//             slug: video.slug,
//             date: video.date ? new Date(video.date) : undefined
//           })))
//         }

//         // const totalPages = response?.pagination?.totalPages || 0
//         // hasMore = page < totalPages
//         // page++
//       } catch (error) {
//         console.error(`Error fetching videos page ${page}:`, error)
//         hasMore = false
//       }
//     // }

//     return videos
//   } catch (error) {
//     console.error('Error fetching all videos:', error)
//     return []
//   }
// }

// // Helper function to fetch all authors
// async function fetchAllAuthors(): Promise<Array<{ slug: string }>> {
//   try {
//     const authors: Array<any> = []
//     let page = 1
//     let hasMore = true
//     const MAX_PAGES = 5

//     // while (hasMore && page <= MAX_PAGES) {
//       try {
//         const response = await ApiService.fetchAllAuthors({
//           page,
//           per_page: 20,
//         })

//         if (response && Array.isArray(response)) {
//           authors.push(...response.map((author: any) => ({
//             slug: author.slug
//           })))
//         }

//         // const totalPages = response?.pagination?.totalPages || 0
//         // hasMore = page < totalPages
//         // page++
//       } catch (error) {
//         console.error(`Error fetching authors page ${page}:`, error)
//         hasMore = false
//       }
//     // }

//     return authors
//   } catch (error) {
//     console.error('Error fetching all authors:', error)
//     return []
//   }
// }

// // Helper function to fetch all tags
// async function fetchAllTags(): Promise<Array<{ slug: string }>> {
//   try {
//     const tags: Array<any> = []
//     let page = 1
//     let hasMore = true
//     const MAX_PAGES = 5

//     // while (hasMore && page <= MAX_PAGES) {
//       try {
//         const response = await ApiService.fetchTags({
//           page,
//           per_page: 10
//         })

//         if (response && Array.isArray(response)) {
//           tags.push(...response.map((tag: any) => ({
//             slug: tag.slug
//           })))
//         }

//         // const totalPages = response?.pagination?.totalPages || 0
//         // hasMore = page < totalPages
//         // page++
//       } catch (error) {
//         console.error(`Error fetching tags page ${page}:`, error)
//         hasMore = false
//       }
//     // }

//     return tags
//   } catch (error) {
//     console.error('Error fetching all tags:', error)
//     return []
//   }
// }


import { MetadataRoute } from 'next'
import { ApiService } from '@/services/apiService'
import { Category } from '@/types/fetchData'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://en.igihe.com'
const FETCH_TIMEOUT_MS = 15_000

// Wraps any promise with a timeout
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ])
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  addStaticPages(entries)

  // Build a category ID→slug map once, reuse everywhere
  const categoryMap = await withTimeout(buildCategoryMap(), FETCH_TIMEOUT_MS, new Map())

  addCategoryPages(entries, categoryMap)

  const [posts, videos, authors, tags] = await Promise.all([
    withTimeout(fetchRecentPosts(500, categoryMap), 120_000, []),
    withTimeout(fetchRecentVideos(100), FETCH_TIMEOUT_MS, []),
    withTimeout(fetchAuthors(50), FETCH_TIMEOUT_MS, []),
    withTimeout(fetchTags(50), FETCH_TIMEOUT_MS, []),
  ])

  addArticlePages(entries, posts)
  addVideoPages(entries, videos)
  addAuthorPages(entries, authors)
//   addTagPages(entries, tags)

  return entries
}

// ─── Category map ────────────────────────────────────────────────────────────

async function buildCategoryMap(): Promise<Map<number, string>> {
  try {
    const { prefetchAllHomeData } = await import('@/lib/prefetch-home-data')
    const data = await prefetchAllHomeData()
    const categories: Category[] = data.categories || []
    return new Map(categories.map(c => [c.id, c.slug]))
  } catch {
    return new Map()
  }
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchRecentPosts(
  limit: number,
  categoryMap: Map<number, string>
): Promise<any[]> {
  const posts: any[] = []
  const perPage = 100
  const maxPages = Math.ceil(limit / perPage)

  for (let page = 1; page <= maxPages && posts.length < limit; page++) {
    try {
      const response = await ApiService.fetchArticles({ page, per_page: perPage })
      if (!response?.data?.length) break

      for (const post of response.data) {
        if (posts.length >= limit) break

        // Synchronous map lookup — no async per-post
        const categorySlug = categoryMap.get(Number(post.categories?.[0])) ?? 'news'
        // const categoryData =  await ApiService.fetchCategoryById(Number(post.categories?.[0]))
        posts.push({
          slug: post.slug,
          categorySlug,
          date: post.date ? new Date(post.date) : undefined,
          modified: post.modified ? new Date(post.modified) : undefined,
        })
      }

      if (!response.pagination?.totalPages || page >= response.pagination.totalPages) break
    } catch (err) {
      console.error(`Posts page ${page} failed:`, err)
      break
    }
  }

  return posts
}

async function fetchRecentVideos(limit: number): Promise<any[]> {
  try {
    const response = await ApiService.fetchVideos({ page: 1, per_page: limit })
    if (!Array.isArray(response)) return []
    return response.slice(0, limit).map((v: any) => ({
      slug: v.slug,
      date: v.date ? new Date(v.date) : undefined,
    }))
  } catch {
    return []
  }
}

async function fetchAuthors(limit: number): Promise<any[]> {
  try {
    const response = await ApiService.fetchAllAuthors({ page: 1, per_page: limit })
    if (!Array.isArray(response)) return []
    return response.slice(0, limit).map((a: any) => ({ slug: a.slug }))
  } catch {
    return []
  }
}

async function fetchTags(limit: number): Promise<any[]> {
  try {
    const response = await ApiService.fetchTags({ page: 1, per_page: limit })
    if (!Array.isArray(response)) return []
    return response.slice(0, limit).map((t: any) => ({ slug: t.slug }))
  } catch {
    return []
  }
}

// ─── Entry builders ───────────────────────────────────────────────────────────

function addStaticPages(entries: MetadataRoute.Sitemap) {
  const now = new Date()
  const pages = [
    { url: BASE_URL,                        changeFrequency: 'hourly' as const, priority: 1.0 },
    { url: `${BASE_URL}/videos`,            changeFrequency: 'daily'  as const, priority: 0.8 },
    { url: `${BASE_URL}/opinion`,           changeFrequency: 'daily'  as const, priority: 0.8 },
    { url: `${BASE_URL}/advertorials`,      changeFrequency: 'weekly' as const, priority: 0.6 },
    { url: `${BASE_URL}/announcements`,     changeFrequency: 'daily'  as const, priority: 0.7 },
    { url: `${BASE_URL}/author`,            changeFrequency: 'weekly' as const, priority: 0.6 },
  ]
  pages.forEach(p => entries.push({ ...p, lastModified: now }))
}

function addCategoryPages(entries: MetadataRoute.Sitemap, categoryMap: Map<number, string>) {
  const now = new Date()
  for (const slug of categoryMap.values()) {
    entries.push({
      url: `${BASE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    })
  }
}

function addArticlePages(entries: MetadataRoute.Sitemap, posts: any[]) {
  posts.forEach(p =>
    entries.push({
      url: `${BASE_URL}/${p.categorySlug}/article/${p.slug}`,
      lastModified: p.modified ?? p.date ?? new Date(),
      changeFrequency: 'weekly',
      priority: p.categorySlug === 'news' ? 0.8 : 0.7,
    })
  )
}

function addVideoPages(entries: MetadataRoute.Sitemap, videos: any[]) {
  videos.forEach(v =>
    entries.push({
      url: `${BASE_URL}/videos/article/${v.slug}`,
      lastModified: v.date ?? new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  )
}

function addAuthorPages(entries: MetadataRoute.Sitemap, authors: any[]) {
  authors.forEach(a =>
    entries.push({
      url: `${BASE_URL}/author/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    })
  )
}

// function addTagPages(entries: MetadataRoute.Sitemap, tags: any[]) {
//   tags.forEach(t =>
//     entries.push({
//       url: `${BASE_URL}/tag/${t.slug}`,
//       lastModified: new Date(),
//       changeFrequency: 'weekly',
//       priority: 0.4,
//     })
//   )
// }