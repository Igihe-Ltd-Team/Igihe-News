import { articlePath, articleSection } from '@/lib/articleSection'

const embeddedIn = (slug: string) => ({ 'wp:term': [[{ id: 1, name: slug, slug, taxonomy: 'category' }]] })

describe('articleSection / articlePath', () => {
  it('sends custom post types to their own section, whatever terms they carry', () => {
    expect(articlePath({ type: 'announcement', slug: 'job-notice', _embedded: embeddedIn('news') } as never)).toBe('/announcement/article/job-notice')
    expect(articlePath({ type: 'advertorial', slug: 'promo' } as never)).toBe('/advertorial/article/promo')
    expect(articlePath({ type: 'opinion', slug: 'view' } as never)).toBe('/opinion/article/view')
  })

  it('sends an ordinary post to its first category, as the cards always did', () => {
    expect(articleSection({ type: 'post', _embedded: embeddedIn('business') } as never)).toBe('business')
    expect(articlePath({ type: 'post', slug: 'a-story', _embedded: embeddedIn('business') } as never)).toBe('/business/article/a-story')
  })

  it('falls back to General for a post without category terms', () => {
    expect(articleSection({ type: 'post' } as never)).toBe('General')
  })

  it('encodes a slug the way the article page expects', () => {
    expect(articlePath({ type: 'announcement', slug: 'école-ouverte' } as never)).toBe('/announcement/article/%C3%A9cole-ouverte')
  })
})
