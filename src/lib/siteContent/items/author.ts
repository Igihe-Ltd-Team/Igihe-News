import type { ContentItems } from '../types'

export const AUTHOR = {
  "author.page.title": {
    group: "Article and list pages",
    label: "Author page: \"written by ...\" title",
    kind: "template",
    default: "Izanditswe na {name}",
    where: "Heading above an author's stories. {name} is replaced by the author's name.",
    maxLength: 80,
    placeholders: ["name"],
  },
  "author.defaultImage": {
    group: "Images and logos",
    label: "Default author photo",
    kind: "image",
    default: "/assets/images.png",
    where: "Shown on an author page when the author has no photo.",
  },
  "author.index.breadcrumb.home": {
    group: "Authors",
    label: "Authors page: \"Home\" crumb",
    kind: "text",
    default: "Home",
    where: "First breadcrumb on the authors page.",
    maxLength: 30,
  },
  "author.index.breadcrumb.current": {
    group: "Authors",
    label: "Authors page: \"Authors\" crumb",
    kind: "text",
    default: "Authors",
    where: "Last breadcrumb on the authors page.",
    maxLength: 30,
  },
  "author.index.title": {
    group: "Authors",
    label: "Authors page title",
    kind: "text",
    default: "Our Authors",
    where: "Main heading of the authors page.",
    maxLength: 60,
  },
  "author.index.subtitle": {
    group: "Authors",
    label: "Authors page subtitle",
    kind: "textarea",
    default: "Meet our talented team of writers and journalists",
    where: "Sentence under the authors page heading.",
    maxLength: 200,
  },
} as const satisfies ContentItems
