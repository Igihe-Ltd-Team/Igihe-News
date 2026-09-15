import {
  ARTICLE_PAGE_ROUTE,
  CATEGORY_PAGE_ROUTE,
  TAG_PAGE_ROUTE,
  buildRevalidationPlan,
  normalizeRevalidateSearchParams,
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
      { path: '/news-sitemap.xml' },
    ]))
    // The XML sitemaps are regenerated files, not cached pages.
    expect(plan.paths).not.toContainEqual({ path: '/sitemap.xml' })
    expect(plan.sitemaps).toEqual({ regenerate: true, removals: [] })
    expect(plan.proxyPatterns).toEqual(expect.arrayContaining(['posts:', 'popular-posts:']))
    expect(plan.warm).toEqual(expect.arrayContaining(['article', 'categories', 'home']))
  })

  it('tells the sitemap job which article left the site', () => {
    expect(buildRevalidationPlan({ type: 'post', slug: 'gone', id: 7, action: 'trash' }).sitemaps)
      .toEqual({ regenerate: true, removals: [{ type: 'post', slug: 'gone', id: 7 }] })
    expect(buildRevalidationPlan({ type: 'opinion', slug: 'draft-again', status: 'draft' }).sitemaps)
      .toEqual({ regenerate: true, removals: [{ type: 'opinion', slug: 'draft-again', id: undefined }] })
    expect(buildRevalidationPlan({ type: 'igh-yt-videos', id: 42, action: 'delete' }).sitemaps)
      .toEqual({ regenerate: true, removals: [{ type: 'video', slug: undefined, id: 42 }] })
    expect(buildRevalidationPlan({ type: 'advertisement' }).sitemaps).toEqual({ regenerate: false, removals: [] })
    expect(buildRevalidationPlan({ type: 'tag', slug: 'rwanda' }).sitemaps).toEqual({ regenerate: false, removals: [] })
  })

  it('revalidates dynamic pages through their route-group-qualified app paths', () => {
    // Next derives the implicit `_N_T_<route>/page` tag from the file route,
    // `(group)` segment included — a bare `/[category]` matches nothing.
    const plan = buildRevalidationPlan({ type: 'post', slug: 'x', category: 'news' })

    expect(plan.paths).toEqual(expect.arrayContaining([
      { path: CATEGORY_PAGE_ROUTE, type: 'page' },
      { path: ARTICLE_PAGE_ROUTE, type: 'page' },
    ]))
    expect(plan.paths).not.toContainEqual({ path: '/[category]', type: 'page' })
    expect(plan.paths).not.toContainEqual({ path: '/[category]/article/[post]', type: 'page' })
    expect(CATEGORY_PAGE_ROUTE).toBe('/(categories)/[category]')
    expect(ARTICLE_PAGE_ROUTE).toBe('/(categories)/[category]/article/[post]')
    expect(TAG_PAGE_ROUTE).toBe('/(tags)/tag/[tag]')

    const tagPlan = buildRevalidationPlan({ type: 'tag', slug: 'rwanda' })
    expect(tagPlan.paths).toEqual(expect.arrayContaining([
      { path: TAG_PAGE_ROUTE, type: 'page' },
      { path: '/tag/rwanda' },
    ]))
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
    ]))
    // Videos live in sitemap-videos.xml (regenerated) — /news-sitemap.xml is articles-only (Google News).
    expect(plan.paths).not.toContainEqual({ path: '/news-sitemap.xml' })
    expect(plan.sitemaps.regenerate).toBe(true)
  })

  it('uses a broad refresh when the content type is absent', () => {
    const plan = buildRevalidationPlan({})

    expect(plan.type).toBe('unknown')
    expect(plan.cachePatterns).toEqual(expect.arrayContaining(['articles:', 'slots:', 'videos:']))
    expect(plan.proxyPatterns).toBe('all')
    expect(plan.paths).toEqual(expect.arrayContaining([
      { path: '/' },
      { path: CATEGORY_PAGE_ROUTE, type: 'page' },
      { path: ARTICLE_PAGE_ROUTE, type: 'page' },
      { path: TAG_PAGE_ROUTE, type: 'page' },
      { path: '/news-sitemap.xml' },
    ]))
    expect(plan.sitemaps.regenerate).toBe(true)
    expect(plan.warm).toEqual(expect.arrayContaining(['categories', 'ads', 'videos', 'home']))
  })

  it('only touches ad-related proxy entries for an advertisement change', () => {
    const plan = buildRevalidationPlan({ type: 'advertisement' })

    expect(plan.proxyPatterns).toEqual(expect.arrayContaining(['advertisement:']))
    expect(plan.proxyPatterns).not.toContain('posts:')
  })

  it('normalizes common WordPress type aliases', () => {
    expect(normalizeWordPressType('posts')).toBe('post')
    expect(normalizeWordPressType('advertisement')).toBe('ads')
  })

  describe('normalizeRevalidateSearchParams', () => {
    it('splits parameters that were appended to the secret with a second "?"', () => {
      const params = normalizeRevalidateSearchParams(
        new URL('https://en.igihe.com/api/revalidate?secret=abc123?type=post&slug=hello').searchParams
      )

      expect(params.get('secret')).toBe('abc123')
      expect(params.get('type')).toBe('post')
      expect(params.get('slug')).toBe('hello')
    })

    it('leaves a well-formed query string untouched', () => {
      const original = new URL('https://en.igihe.com/api/revalidate?secret=abc123&type=post').searchParams
      const params = normalizeRevalidateSearchParams(original)

      expect(params).toBe(original)
      expect(params.get('secret')).toBe('abc123')
      expect(params.get('type')).toBe('post')
    })

    it('does nothing when there is no secret parameter', () => {
      const original = new URL('https://en.igihe.com/api/revalidate?type=post').searchParams
      expect(normalizeRevalidateSearchParams(original)).toBe(original)
    })
  })
})
