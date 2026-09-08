import {
  buildRevalidationPlan,
  normalizeWordPressType,
} from '@/lib/wordpressRevalidation'

describe('WordPress revalidation planning', () => {
  it('targets an updated post and its category', () => {
    const plan = buildRevalidationPlan({
      type: 'post',
      slug: 'breaking-news',
      category: 'business',
    })

    expect(plan.cachePatterns).toEqual(expect.arrayContaining([
      'post:breaking-news',
      'articles:',
      'category:',
    ]))
    expect(plan.paths).toEqual(expect.arrayContaining([
      { path: '/' },
      { path: '/business' },
      { path: '/business/article/breaking-news' },
      { path: '/sitemap.xml' },
      { path: '/news-sitemap.xml' },
    ]))
    expect(plan.warm).toEqual(expect.arrayContaining(['article', 'categories', 'home']))
  })

  it('refreshes ad slots without invalidating all article pages', () => {
    const plan = buildRevalidationPlan({ type: 'advertisement' })

    expect(plan.type).toBe('ads')
    expect(plan.cachePatterns).toContain('slots:')
    expect(plan.cachePatterns).not.toContain('articles:')
    expect(plan.warm).toEqual(expect.arrayContaining(['ads', 'home']))
  })

  it('targets videos by id and slug', () => {
    const plan = buildRevalidationPlan({ type: 'igh-yt-videos', id: 42, slug: 'interview' })

    expect(plan.cachePatterns).toEqual(expect.arrayContaining(['videos:', 'video:42']))
    expect(plan.paths).toEqual(expect.arrayContaining([
      { path: '/videos' },
      { path: '/videos/interview' },
      { path: '/sitemap.xml' },
    ]))
    // Only /sitemap.xml lists videos — /news-sitemap.xml is posts-only (Google News).
    expect(plan.paths).not.toContainEqual({ path: '/news-sitemap.xml' })
  })

  it('uses a broad refresh when the content type is absent', () => {
    const plan = buildRevalidationPlan({})

    expect(plan.type).toBe('unknown')
    expect(plan.cachePatterns).toEqual(expect.arrayContaining(['articles:', 'slots:', 'videos:']))
    expect(plan.warm).toEqual(expect.arrayContaining(['categories', 'ads', 'videos', 'home']))
  })

  it('normalizes common WordPress type aliases', () => {
    expect(normalizeWordPressType('posts')).toBe('post')
    expect(normalizeWordPressType('advertisement')).toBe('ads')
  })
})
