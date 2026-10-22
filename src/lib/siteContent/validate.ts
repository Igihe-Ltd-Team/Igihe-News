import { isSafeFooterUrl } from '@/lib/footer/footerSchema'
import { isTrustedUploadUrl } from '@/lib/storage/uploadUrl'
import { DEFAULT_MAX_LENGTH, type ContentItemDef } from './types'
import { parsePageDoc } from './pageDocs'


/** Cloudinary folder every site-content image is uploaded to. */
export const SITE_CONTENT_IMAGE_FOLDER = 'site-content'

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/

/** An image is either one of the files shipped with the site (/assets/...) or one of OUR uploads in the site-content folder. */
export function isAllowedContentImage(url: string): boolean {
  if (url.length > 500 || url.includes('..') || /[\s"'<>\\]/.test(url)) return false
  if (/^\/assets\/[A-Za-z0-9._/-]+\.(png|jpe?g|webp|gif|svg)$/i.test(url)) return true
  return url.startsWith('https://') && isTrustedUploadUrl(url, SITE_CONTENT_IMAGE_FOLDER)
}

const placeholdersIn = (value: string) => [...value.matchAll(/\{([A-Za-z0-9_]+)\}/g)].map(match => match[1])

export type ValidationResult = { ok: true; value: string } | { ok: false; error: string }

/**
 * The one rule for "may this value be shown for this item". Used by the dashboard API (reject)
 * and by the public read (drop a stored value that no longer passes, falling back to the default).
 */
export function validateContentValue(item: ContentItemDef, raw: unknown): ValidationResult {
  if (typeof raw !== 'string') return { ok: false, error: 'Enter a value' }

  switch (item.kind) {
    case 'text':
    case 'template': {
      const value = raw.trim()
      const max = item.maxLength ?? DEFAULT_MAX_LENGTH[item.kind]
      if (!value) return { ok: false, error: 'Cannot be empty - use "Reset to default" instead' }
      if (value.length > max) return { ok: false, error: `Must be at most ${max} characters` }
      if (CONTROL.test(value) || /[\n\r]/.test(value)) return { ok: false, error: 'Must be a single line of plain text' }
      if (/[<>]/.test(value)) return { ok: false, error: 'Do not use < or >' }
      if (item.kind === 'template') {
        const allowed = new Set(item.placeholders ?? [])
        const unknown = placeholdersIn(value).filter(name => !allowed.has(name))
        if (unknown.length) return { ok: false, error: `Unknown placeholder {${unknown[0]}}. Allowed: ${[...allowed].map(name => `{${name}}`).join(', ') || 'none'}` }
        const missing = [...allowed].filter(name => !value.includes(`{${name}}`))
        if (missing.length) return { ok: false, error: `Keep ${missing.map(name => `{${name}}`).join(', ')} in the text: it is replaced with the real value` }
      }
      return { ok: true, value }
    }
    case 'textarea': {
      const value = raw.replace(/\r\n/g, '\n').trim()
      const max = item.maxLength ?? DEFAULT_MAX_LENGTH.textarea
      if (!value) return { ok: false, error: 'Cannot be empty - use "Reset to default" instead' }
      if (value.length > max) return { ok: false, error: `Must be at most ${max} characters` }
      if (CONTROL.test(value)) return { ok: false, error: 'Contains invalid characters' }
      if (/[<>]/.test(value)) return { ok: false, error: 'Do not use < or >' }
      return { ok: true, value }
    }
    case 'image': {
      const value = raw.trim()
      if (item.optional && value === '') return { ok: true, value }
      return isAllowedContentImage(value) ? { ok: true, value } : { ok: false, error: 'That image is not allowed. Upload one from the dashboard.' }
    }
    case 'link': {
      const value = raw.trim()
      if (item.optional && value === '') return { ok: true, value }
      // '#' is the existing placeholder some menu entries use; everything else must be a safe link.
      return value === '#' || isSafeFooterUrl(value) ? { ok: true, value } : { ok: false, error: 'Enter a full link (https://...), a path starting with /, or a mailto:/tel: link' }
    }
    case 'color': {
      // A colour for an email design: #rrggbb only (no names, rgb() or alpha), so it is safe to place inside inline styles.
      const value = raw.trim().toLowerCase()
      return /^#[0-9a-f]{6}$/.test(value) ? { ok: true, value } : { ok: false, error: 'Use a colour like #1176bb (a # and six letters or digits)' }
    }
    case 'page': {
      if (!item.page) return { ok: false, error: 'This page cannot be edited' }
      const parsed = parsePageDoc(item.page, raw)
      return parsed.ok ? { ok: true, value: JSON.stringify(parsed.value) } : { ok: false, error: parsed.error }
    }
  }
}
