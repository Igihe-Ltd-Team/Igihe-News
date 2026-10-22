import { z } from 'zod'

// The footer as data. This is what the dashboard edits, what is stored as JSON, and what the
// public footer renders. Everything an admin can type is validated here, once, for both the
// editor's checks and the server's - the server never trusts the browser.

export const FOOTER_ICON_KEYS = [
  'facebook', 'youtube', 'tiktok', 'whatsapp', 'x', 'instagram', 'linkedin', 'telegram', 'email', 'website',
] as const
export type FooterIconKey = (typeof FOOTER_ICON_KEYS)[number]

export const FOOTER_ICON_LABELS: Record<FooterIconKey, string> = {
  facebook: 'Facebook', youtube: 'YouTube', tiktok: 'TikTok', whatsapp: 'WhatsApp', x: 'X (Twitter)',
  instagram: 'Instagram', linkedin: 'LinkedIn', telegram: 'Telegram', email: 'Email', website: 'Website / other',
}

export const FOOTER_LIMITS = {
  /** Newsletter + social + app badges + up to three link columns (the layout fits six). */
  maxColumns: 6,
  maxItemsPerColumn: 12,
  maxAppBadges: 4,
  maxBottomLinks: 8,
  heading: 60,
  title: 120,
  description: 300,
  label: 40,
  url: 500,
  companyName: 80,
  minYear: 1990,
  /** Hard ceiling on the stored document, whatever the individual limits add up to. */
  maxJsonBytes: 40_000,
} as const

const hasControlChars = (value: string) => /[\u0000-\u001f\u007f]/.test(value)

/**
 * Where a footer link may point: a full http(s) address, a mail or phone link, or a path on
 * this site. Never javascript:, data:, a protocol-relative //host, or anything with spaces or
 * control characters - these URLs are rendered into every public page.
 */
export function isSafeFooterUrl(url: string): boolean {
  if (url.length === 0 || url.length > FOOTER_LIMITS.url || /[\s<>"'\\`]/.test(url) || hasControlChars(url)) return false
  if (url.startsWith('/')) return !url.startsWith('//')
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(url)) return true
  if (/^tel:\+?[0-9][0-9\-().]{3,30}$/i.test(url)) return true
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && Boolean(parsed.hostname) && !parsed.username && !parsed.password
  } catch {
    return false
  }
}

const id = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, 'Invalid id')
const text = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} cannot be empty`)
    .max(max, `${label} must be at most ${max} characters`)
    .refine(value => !hasControlChars(value), `${label} contains invalid characters`)
const url = z.string().trim().refine(isSafeFooterUrl, 'Enter a full link (https://…), a path starting with /, or a mailto:/tel: link')

export const footerLinkSchema = z.object({
  id,
  label: text(FOOTER_LIMITS.label, 'Label'),
  url,
  newTab: z.boolean(),
})

export const footerSocialItemSchema = footerLinkSchema.extend({
  icon: z.enum(FOOTER_ICON_KEYS),
  /** Adds the extra padded box around the item that X and Instagram have always had. */
  boxed: z.boolean(),
})

export const FOOTER_APP_STORES = ['apple', 'google'] as const
export type FooterAppStore = (typeof FOOTER_APP_STORES)[number]
export const FOOTER_APP_STORE_LABELS: Record<FooterAppStore, string> = { apple: 'App Store', google: 'Google Play' }

export const footerAppItemSchema = footerLinkSchema.extend({
  /** Picks the badge icon and its small caption ("Download on the" / "Get it on"). */
  store: z.enum(FOOTER_APP_STORES),
})

const newsletterColumn = z.object({
  id,
  type: z.literal('newsletter'),
  heading: text(FOOTER_LIMITS.heading, 'Heading'),
  title: text(FOOTER_LIMITS.title, 'Title'),
  description: text(FOOTER_LIMITS.description, 'Description'),
})
const socialColumn = z.object({
  id,
  type: z.literal('social'),
  heading: text(FOOTER_LIMITS.heading, 'Heading'),
  items: z.array(footerSocialItemSchema).max(FOOTER_LIMITS.maxItemsPerColumn, `At most ${FOOTER_LIMITS.maxItemsPerColumn} links per column`),
})
const appsColumn = z.object({
  id,
  type: z.literal('apps'),
  heading: text(FOOTER_LIMITS.heading, 'Heading'),
  description: text(FOOTER_LIMITS.description, 'Description'),
  items: z.array(footerAppItemSchema).max(FOOTER_LIMITS.maxAppBadges, `At most ${FOOTER_LIMITS.maxAppBadges} app badges`),
})
const linksColumn = z.object({
  id,
  type: z.literal('links'),
  heading: text(FOOTER_LIMITS.heading, 'Heading'),
  items: z.array(footerLinkSchema).max(FOOTER_LIMITS.maxItemsPerColumn, `At most ${FOOTER_LIMITS.maxItemsPerColumn} links per column`),
})

export const footerColumnSchema = z.discriminatedUnion('type', [newsletterColumn, socialColumn, appsColumn, linksColumn])

export const footerConfigSchema = z
  .object({
    columns: z.array(footerColumnSchema).max(FOOTER_LIMITS.maxColumns, `At most ${FOOTER_LIMITS.maxColumns} columns`),
    bottom: z.object({
      /** Optional: with it the line reads "© 2008 - 2026 …", without it "© 2026 …". */
      startYear: z.number().int().min(FOOTER_LIMITS.minYear, `Year must be ${FOOTER_LIMITS.minYear} or later`).max(2100).optional(),
      companyName: text(FOOTER_LIMITS.companyName, 'Company name'),
      links: z.array(footerLinkSchema).max(FOOTER_LIMITS.maxBottomLinks, `At most ${FOOTER_LIMITS.maxBottomLinks} links`),
    }),
  })
  .superRefine((config, ctx) => {
    // Ids are how the editor, the history diff and React tell items apart, so they must not repeat.
    const seen = new Set<string>()
    const check = (value: string, path: (string | number)[]) => {
      if (seen.has(value)) ctx.addIssue({ code: 'custom', message: `Duplicate id "${value}"`, path })
      seen.add(value)
    }
    config.columns.forEach((column, c) => {
      check(column.id, ['columns', c, 'id'])
      if (column.type !== 'newsletter') column.items.forEach((item, i) => check(item.id, ['columns', c, 'items', i, 'id']))
    })
    config.bottom.links.forEach((item, i) => check(item.id, ['bottom', 'links', i, 'id']))
    if (new Set(config.columns.filter(column => column.type === 'newsletter').map(column => column.type)).size === 1
      && config.columns.filter(column => column.type === 'newsletter').length > 1) {
      ctx.addIssue({ code: 'custom', message: 'There can be only one newsletter column', path: ['columns'] })
    }
    if (config.columns.filter(column => column.type === 'social').length > 1) {
      ctx.addIssue({ code: 'custom', message: 'There can be only one social column', path: ['columns'] })
    }
    if (config.columns.filter(column => column.type === 'apps').length > 1) {
      ctx.addIssue({ code: 'custom', message: 'There can be only one app badges column', path: ['columns'] })
    }
    if (JSON.stringify(config).length > FOOTER_LIMITS.maxJsonBytes) {
      ctx.addIssue({ code: 'custom', message: 'The footer is too large', path: [] })
    }
  })

export type FooterLink = z.infer<typeof footerLinkSchema>
export type FooterAppItem = z.infer<typeof footerAppItemSchema>
export type FooterSocialItem = z.infer<typeof footerSocialItemSchema>
export type FooterColumn = z.infer<typeof footerColumnSchema>
export type FooterConfig = z.infer<typeof footerConfigSchema>

/** Short random id for a new column or link. */
export function newFooterId(prefix: string): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().replace(/-/g, '').slice(0, 8) : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${random}`
}
