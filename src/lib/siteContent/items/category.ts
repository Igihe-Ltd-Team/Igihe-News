import type { ContentItems } from '../types'

export const CATEGORY = {
  "category.more.title": {
    group: "Article and list pages",
    label: "Category page: \"more stories in ...\" title",
    kind: "template",
    default: "Andi mu {name}",
    where: "Heading above the list on a category page. {name} is replaced by the category name.",
    maxLength: 80,
    placeholders: ["name"],
  },
} as const satisfies ContentItems
