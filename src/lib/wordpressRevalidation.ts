export interface WordPressChange {
  slug?: string
  id?: number
  type?: string
  category?: string
  categories?: string[]
  action?: string
  status?: string
}

export interface RevalidationPlan {
  type: string
  cachePatterns: string[]
  paths: Array<{ path: string; type?: 'page' | 'layout' }>
  warm: Array<'article' | 'categories' | 'home' | 'ads' | 'videos'>
}

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

export function buildRevalidationPlan(change: WordPressChange): RevalidationPlan {
  const type = normalizeWordPressType(change.type)
  const categories = unique([change.category, ...(change.categories || [])].filter(Boolean) as string[])
  const cachePatterns = ['search:', 'popular:']
  const paths: RevalidationPlan['paths'] = [{ path: '/' }]
  const warm: RevalidationPlan['warm'] = ['home']

  const addContentPaths = () => {
    paths.push({ path: '/[category]/article/[post]', type: 'page' })
    paths.push({ path: '/[category]', type: 'page' })
    categories.forEach(category => {
      paths.push({ path: `/${category}` })
      if (change.slug) paths.push({ path: `/${category}/article/${change.slug}` })
    })
  }

  switch (type) {
    case 'post':
      cachePatterns.push('articles:', 'categories:', 'category:', 'author-posts:')
      if (change.slug) {
        cachePatterns.push(`post:${change.slug}`)
        warm.push('article')
      }
      warm.push('categories')
      addContentPaths()
      break
    case 'ads':
      cachePatterns.push('slots:')
      warm.push('ads')
      break
    case 'video':
      cachePatterns.push('videos:')
      if (change.id) cachePatterns.push(`video:${change.id}`)
      paths.push({ path: '/videos' })
      if (change.slug) paths.push({ path: `/videos/${change.slug}` })
      warm.push('videos')
      break
    case 'opinion':
      cachePatterns.push('opinion:')
      paths.push({ path: '/opinion' })
      addContentPaths()
      break
    case 'advertorial':
      cachePatterns.push('advertorial:')
      paths.push({ path: '/advertorials' })
      addContentPaths()
      break
    case 'announcement':
      cachePatterns.push('announcement:')
      paths.push({ path: '/announcements' })
      addContentPaths()
      break
    case 'fact-of-the-day':
      cachePatterns.push('fact-of-the-day:')
      break
    case 'category':
      cachePatterns.push('categories:', 'category:', 'articles:')
      paths.push({ path: '/[category]', type: 'page' })
      categories.forEach(category => paths.push({ path: `/${category}` }))
      warm.push('categories')
      break
    case 'tag':
      cachePatterns.push('tags:', 'articles:')
      paths.push({ path: '/tag/[tag]', type: 'page' })
      if (change.slug) paths.push({ path: `/tag/${change.slug}` })
      break
    case 'author':
      cachePatterns.push('author:', 'author-posts:', 'articles:')
      paths.push({ path: '/author/[slug]', type: 'page' })
      if (change.slug) paths.push({ path: `/author/${change.slug}` })
      break
    default:
      cachePatterns.push(
        'post:', 'articles:', 'opinion:', 'advertorial:', 'announcement:',
        'fact-of-the-day:', 'categories:', 'category:', 'tags:', 'author:',
        'author-posts:', 'slots:', 'videos:', 'video:'
      )
      paths.push(
        { path: '/[category]/article/[post]', type: 'page' },
        { path: '/[category]', type: 'page' },
        { path: '/tag/[tag]', type: 'page' },
        { path: '/opinion' },
        { path: '/advertorials' },
        { path: '/announcements' },
        { path: '/videos' }
      )
      warm.push('categories', 'ads', 'videos')
  }

  return {
    type,
    cachePatterns: unique(cachePatterns),
    paths: paths.filter((item, index, all) =>
      all.findIndex(other => other.path === item.path && other.type === item.type) === index
    ),
    warm: unique(warm),
  }
}
