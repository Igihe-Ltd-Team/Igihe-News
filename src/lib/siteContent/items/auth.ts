import type { ContentItems } from '../types'

export const AUTH = {
  "auth.hero.image": {
    group: "Sign-in and register pages",
    label: "Sign-in page: large side picture",
    kind: "image",
    default: "/assets/auth-hero.webp",
    where: "The big picture on the left of the sign-in, register and password pages (desktop).",
  },
  "auth.hero.title": {
    group: "Sign-in and register pages",
    label: "Sign-in page: headline",
    kind: "text",
    default: "Real Stories, Real Community",
    where: "Large text over the side picture.",
    maxLength: 60,
  },
  "auth.hero.subtitle": {
    group: "Sign-in and register pages",
    label: "Sign-in page: sentence under the headline",
    kind: "textarea",
    default: "Join thousands of Rwandans reporting, discussing, and shaping the stories that matter to them.",
    where: "Smaller text over the side picture.",
    maxLength: 200,
  },
  "auth.backLink": {
    group: "Sign-in and register pages",
    label: "\"Back to website\" link",
    kind: "text",
    default: "Back to website",
    where: "Link at the top of the sign-in pages that returns to the site.",
    maxLength: 40,
  },
  "auth.logo.image": {
    group: "Sign-in and register pages",
    label: "Sign-in page: small logo (phones)",
    kind: "image",
    default: "/assets/icon.png",
    where: "Small logo at the top of the sign-in pages on phones.",
  },
  "auth.logo.text": {
    group: "Sign-in and register pages",
    label: "Sign-in page: name next to the logo",
    kind: "text",
    default: "IGIHE",
    where: "Word next to the small logo on phones.",
    maxLength: 30,
  },
} as const satisfies ContentItems
