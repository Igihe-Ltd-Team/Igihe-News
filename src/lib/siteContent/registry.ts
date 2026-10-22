import type { ContentItemDef, ContentItems } from './types'
import { ARTICLE } from './items/article'
import { ARTICLES } from './items/articles'
import { AUTH } from './items/auth'
import { AUTHOR } from './items/author'
import { CATEGORY } from './items/category'
import { COMMENTS } from './items/comments'
import { GLOBAL } from './items/global'
import { HEADER } from './items/header'
import { HOME } from './items/home'
import { NEWSLETTER } from './items/newsletter'
import { PAGES } from './items/pages'
import { SEARCH } from './items/search'
import { SHORTS } from './items/shorts'
import { SIDEBAR } from './items/sidebar'
import { VIDEOS } from './items/videos'

// Every editable item of the public site, with its CURRENT text/image/link as the default.
// To make something editable: add it to an items/* file, then read it with `content.get(key)`
// (server: `await getSiteContent()`, browser: `useSiteContent()`). TypeScript then refuses a
// misspelt key. Defaults must be exactly what the site showed before the item became editable.

export const SITE_CONTENT = {
  ...ARTICLE,
  ...ARTICLES,
  ...AUTH,
  ...AUTHOR,
  ...CATEGORY,
  ...COMMENTS,
  ...GLOBAL,
  ...HEADER,
  ...HOME,
  ...NEWSLETTER,
  ...PAGES,
  ...SEARCH,
  ...SHORTS,
  ...SIDEBAR,
  ...VIDEOS,
} as const satisfies ContentItems

export type SiteKey = keyof typeof SITE_CONTENT

/** The same items typed generically (kind is any kind), for code that handles all items alike: the dashboard, validation. */
export const ITEMS: Readonly<Record<SiteKey, ContentItemDef>> = SITE_CONTENT

export const SITE_KEYS = Object.keys(SITE_CONTENT) as SiteKey[]
export const isSiteKey = (key: string): key is SiteKey => Object.hasOwn(SITE_CONTENT, key)

/** The order groups appear in the dashboard: the most-edited, most visible areas first. */
export const GROUP_ORDER: readonly string[] = [
  'Home sections',
  'Header menu',
  'Article and list pages',
  'Comments',
  'Videos',
  'Authors',
  'Search',
  'Social media and sharing',
  'Images and logos',
  'Global labels',
  'Sign-in and register pages',
  'Newsletter unsubscribe page',
  'Newsletter email',
]
