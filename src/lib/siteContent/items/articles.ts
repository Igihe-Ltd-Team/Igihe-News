import type { ContentItems } from '../types'

export const ARTICLES = {
  "articles.more.title": {
    group: "Article and list pages",
    label: "\"Other latest news\" title",
    kind: "text",
    default: "Other Latest News",
    where: "Heading above the list on the /articles page.",
    maxLength: 60,
  },
} as const satisfies ContentItems
