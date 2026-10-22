import { z } from 'zod'
import { isSafeFooterUrl } from '@/lib/footer/footerSchema'

// Text rules shared by the editable long pages (/ubwanditsi, /policy, /gutanga-amakuru).
// Text uses the site's inline markup only: {{bold}} and [link text->https://...]. Raw HTML is never stored.

export const PAGE_TEXT_LIMITS = { maxText: 4000, maxLine: 200, maxItems: 40, maxSections: 14, maxBlocks: 30 } as const

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
const LINK_MARKUP = /\[([^\]]+?)->([^\]]+?)\]/g

/** Every [label->address] in a text. */
export const textLinks = (value: string): string[] => [...value.matchAll(LINK_MARKUP)].map(match => match[2].trim())

/** Text with {{bold}} / [link->address] markup; may contain line breaks. */
export const richText = (max: number = PAGE_TEXT_LIMITS.maxText) =>
  z
    .string()
    .max(max, `Must be at most ${max} characters`)
    .refine(value => !CONTROL.test(value), 'Contains invalid characters')
    // The link markup contains a '>', so it is set aside before looking for raw HTML.
    .refine(value => !/[<>]/.test(value.replace(LINK_MARKUP, '')), 'Do not use < or >')
    .refine(value => textLinks(value).every(isSafeFooterUrl), 'A link in this text is not allowed. Use https://..., mailto:, tel: or a path starting with /')
    .transform(value => value.replace(/\r\n/g, '\n').trim())
    .pipe(z.string().min(1, 'Cannot be empty'))

/** A single line of the same kind of text (headings, labels). */
export const lineText = (max: number = PAGE_TEXT_LIMITS.maxLine) =>
  richText(max).refine(value => !value.includes('\n'), 'Must be a single line')

/** Where a button or link goes: https, mailto, tel or a path on this site. */
export const linkTarget = z
  .string()
  .max(500)
  .transform(value => value.trim())
  .refine(isSafeFooterUrl, 'Enter a full link (https://...), a path starting with /, or a mailto:/tel: link')

export const textList = (max: number = PAGE_TEXT_LIMITS.maxItems) => z.array(richText()).min(1, 'Needs at least one item').max(max)

/** Parses a stored/submitted page document (a JSON string) against a page's schema. */
export function parseDoc<T extends z.ZodTypeAny>(schema: T, raw: string): { ok: true; value: z.infer<T> } | { ok: false; error: string } {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'The page content is not valid' }
  }
  const parsed = schema.safeParse(json)
  if (parsed.success) return { ok: true, value: parsed.data }
  const issue = parsed.error.issues[0]
  return { ok: false, error: `${issue.path.join(' › ') || 'page'}: ${issue.message}` }
}
