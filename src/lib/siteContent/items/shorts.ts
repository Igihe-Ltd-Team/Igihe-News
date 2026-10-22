import type { ContentItems } from '../types'

export const SHORTS = {
  "shorts.title": {
    group: "Videos",
    label: "Shorts page title",
    kind: "text",
    default: "IGIHE Short",
    where: "Heading of the shorts gallery.",
    maxLength: 60,
  },
  "shorts.empty": {
    group: "Videos",
    label: "Shorts gallery: nothing yet",
    kind: "text",
    default: "No videos yet. Check back soon.",
    where: "Shown when there are no shorts to display.",
    maxLength: 100,
  },
  "shorts.player.counter": {
    group: "Videos",
    label: "Shorts player: position line",
    kind: "template",
    default: "{date} · {n} of {total}",
    where: "Line under a short, e.g. \"12 Oct 2026 · 3 of 20\".",
    maxLength: 60,
    placeholders: ["date", "n", "total"],
  },
  "shorts.player.watchOnYouTube": {
    group: "Videos",
    label: "Shorts player: \"watch on YouTube\"",
    kind: "text",
    default: "Watch on YouTube",
    where: "Link under a short that opens it on YouTube.",
    maxLength: 40,
  },
} as const satisfies ContentItems
