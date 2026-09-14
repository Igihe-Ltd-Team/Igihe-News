export interface WordPressChange {
  slug?: string
  id?: number
  type?: string
  category?: string
  categories?: string[]
  action?: string
  status?: string
  language?: string  // "rw" | "en" | "fr" — passed from WordPress publish hook
}

export interface RevalidationPlan {
  type: string
  cachePatterns: string[]
  /**
   * Key prefixes to drop from the in-memory `/api/proxy` cache (see
   * `src/lib/proxyCache.ts`). Client components paginate and "load more"
   * through that route, so leaving it untouched let stale lists survive a
   * webhook for up to the proxy TTL. `'all'` wipes the whole proxy cache.
   */
  proxyPatterns: string[] | 'all'
  paths: Array<{ path: string; type?: 'page' | 'layout' }>
  warm: Array<'article' | 'categories' | 'home' | 'ads' | 'videos'>
}

// Route-group-qualified page paths. `revalidatePath(path, 'page')` matches the
// implicit `_N_T_<app route>/page` tag Next derives from the *file* route, and
// that route includes the `(group)` segment — so `/[category]` on its own
// silently matched nothing and category pages were never revalidated.
export const CATEGORY_PAGE_ROUTE = '/(categories)/[category]'
export const ARTICLE_PAGE_ROUTE = '/(categories)/[category]/article/[post]'
export const TAG_PAGE_ROUTE = '/(tags)/tag/[tag]'

const aliases: Record<string, string> = {
  posts: 'post',
  advertisement: 'ads',
  advertisements: 'ads',
  ad: 'ads',
  'igh-yt-videos': 'video',
  videos: 'video',
  opinions: 'opinion',
  advertorials: 'advertorial',
  announcements: 'announcement',
  facts: 'fact-of-the-day',
  tags: 'tag',
  byline: 'author',
  bylines: 'author',
}

const unique = <T>(items: T[]) => [...new Set(items)]

export function normalizeWordPressType(type?: string): string {
  const normalized = type?.trim().toLowerCase() || 'unknown'
  return aliases[normalized] || normalized
}

/**
 * Tolerates a hand-typed webhook URL whose extra parameters were appended
 * with a second `?` instead of `&`, e.g.
 * `/api/revalidate?secret=abc?type=post` — which otherwise arrives as a
 * single `secret` value of `abc?type=post` and fails authorization.
 */
export function normalizeRevalidateSearchParams(params: URLSearchParams): URLSearchParams {
  const secret = params.get('secret')
  if (!secret || !secret.includes('?')) return params

  const separator = secret.indexOf('?')
  const normalized = new URLSearchParams(params)
  normalized.set('secret', secret.slice(0, separator))
  new URLSearchParams(secret.slice(separator + 1)).forEach((value, key) => {
    normalized.append(key, value)
  })
  return normalized
}

export function buildRevalidationPlan(change: WordPressChange): RevalidationPlan {
  const type = normalizeWordPressType(change.type)
  const categories = unique([change.category, ...(change.categories || [])].filter(Boolean) as string[])
  const cachePatterns = ['search:', 'popular:']
  let proxyPatterns: string[] | 'all' = ['popular-posts:']
  // Sitemaps are keyed off /sitemap.ts and news-sitemap.xml's own data-fetch
  // cache, not off any of the paths below — nothing was ever telling them to
  // refresh when content changed, so they only ever caught up once their own
  // background revalidation window happened to pass.
  const paths: RevalidationPlan['paths'] = [{ path: '/' }, { path: '/sitemap.xml' }]
  const warm: RevalidationPlan['warm'] = ['home']

  const addContentPaths = () => {
    paths.push({ path: ARTICLE_PAGE_ROUTE, type: 'page' })
    paths.push({ path: CATEGORY_PAGE_ROUTE, type: 'page' })
    categories.forEach(category => {
      paths.push({ path: `/${category}` })
      if (change.slug) paths.push({ path: `/${category}/article/${change.slug}` })
    })
  }

  switch (type) {
    case 'post':
      cachePatterns.push('articles:', 'categories:', 'category:', 'author-posts:')
      proxyPatterns.push('posts:')
      if (change.slug) {
        cachePatterns.push(`post:${change.slug}`)
        warm.push('article')
      }
      warm.push('categories')
      addContentPaths()
      paths.push({ path: '/news-sitemap.xml' })
      break
    case 'ads':
      cachePatterns.push('slots:')
      proxyPatterns.push('advertisement:')
      warm.push('ads')
      break
    case 'video':
      cachePatterns.push('videos:')
      proxyPatterns.push('igh-yt-videos:')
      if (change.id) cachePatterns.push(`video:${change.id}`)
      paths.push({ path: '/videos' })
      if (change.slug) paths.push({ path: `/videos/${change.slug}` })
      warm.push('videos')
      break
    case 'opinion':
      cachePatterns.push('opinion:')
      proxyPatterns.push('opinion:')
      paths.push({ path: '/opinion' })
      addContentPaths()
      break
    case 'advertorial':
      cachePatterns.push('advertorial:')
      proxyPatterns.push('advertorial:')
      paths.push({ path: '/advertorials' })
      addContentPaths()
      break
    case 'announcement':
      cachePatterns.push('announcement:')
      proxyPatterns.push('announcement:')
      paths.push({ path: '/announcements' })
      addContentPaths()
      break
    case 'fact-of-the-day':
      cachePatterns.push('fact-of-the-day:')
      proxyPatterns.push('fact-of-the-day:')
      break
    case 'category':
      cachePatterns.push('categories:', 'category:', 'articles:')
      proxyPatterns.push('categories:', 'posts:')
      paths.push({ path: CATEGORY_PAGE_ROUTE, type: 'page' })
      categories.forEach(category => paths.push({ path: `/${category}` }))
      warm.push('categories')
      break
    case 'tag':
      cachePatterns.push('tags:', 'articles:')
      proxyPatterns.push('tags:', 'posts:')
      paths.push({ path: TAG_PAGE_ROUTE, type: 'page' })
      if (change.slug) paths.push({ path: `/tag/${change.slug}` })
      break
    case 'author':
      cachePatterns.push('author:', 'author-posts:', 'articles:')
      proxyPatterns.push('byline', 'posts:')
      paths.push({ path: '/author/[slug]', type: 'page' })
      if (change.slug) paths.push({ path: `/author/${change.slug}` })
      break
    default:
      cachePatterns.push(
        'post:', 'articles:', 'opinion:', 'advertorial:', 'announcement:',
        'fact-of-the-day:', 'categories:', 'category:', 'tags:', 'author:',
        'author-posts:', 'slots:', 'videos:', 'video:'
      )
      proxyPatterns = 'all'
      paths.push(
        { path: ARTICLE_PAGE_ROUTE, type: 'page' },
        { path: CATEGORY_PAGE_ROUTE, type: 'page' },
        { path: TAG_PAGE_ROUTE, type: 'page' },
        { path: '/opinion' },
        { path: '/advertorials' },
        { path: '/announcements' },
        { path: '/videos' },
        { path: '/news-sitemap.xml' }
      )
      warm.push('categories', 'ads', 'videos')
  }

  return {
    type,
    cachePatterns: unique(cachePatterns),
    proxyPatterns: proxyPatterns === 'all' ? 'all' : unique(proxyPatterns),
    paths: paths.filter((item, index, all) =>
      all.findIndex(other => other.path === item.path && other.type === item.type) === index
    ),
    warm: unique(warm),
  }
}
