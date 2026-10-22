import type { ContentItems } from '../types'

export const VIDEOS = {
  "videos.related.title": {
    group: "Videos",
    label: "\"More videos\" title",
    kind: "text",
    default: "Andi Mashusho",
    where: "Heading above the other videos on a video page.",
    maxLength: 60,
  },
  "videos.list.title": {
    group: "Videos",
    label: "Videos page title",
    kind: "text",
    default: "Amashusho",
    where: "Heading at the top of the /videos page.",
    maxLength: 60,
  },
  "videos.single.unavailable": {
    group: "Videos",
    label: "\"Video unavailable\" message",
    kind: "text",
    default: "Amashusho Ntabashije kuboneka.",
    where: "Shown on a video page when the video cannot be played.",
    maxLength: 100,
  },
  "videos.title.fallback": {
    group: "Videos",
    label: "Title for a video with no title",
    kind: "text",
    default: "Untitled Video",
    where: "Used when a video has no title.",
    maxLength: 60,
  },
} as const satisfies ContentItems
