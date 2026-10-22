import type { NewsItem } from '@/types/fetchData'
import { getCategorySlug } from './utils'
import { encodeSegment } from './slugLookup'

/**
 * Where an article lives on this site. Opinions, advertorials and announcements are WordPress
 * post types with their own section; everything else is an ordinary post under its category.
 * The article page resolves a slug through the section named in the address, so a link built
 * from the wrong section (an announcement under /advertorial/...) ends in "not found".
 */
export const TYPE_SECTIONS: Record<string, string> = {
  opinion: 'opinion',
  advertorial: 'advertorial',
  announcement: 'announcement',
}

export function articleSection(article: Pick<NewsItem, 'type'> & Partial<NewsItem>): string {
  return TYPE_SECTIONS[article.type ?? ''] ?? getCategorySlug(article as NewsItem)
}

export function articlePath(article: Pick<NewsItem, 'type' | 'slug'> & Partial<NewsItem>): string {
  return `/${articleSection(article)}/article/${encodeSegment(article.slug)}`
}
