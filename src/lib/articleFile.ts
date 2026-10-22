/**
 * The file attached to an article (announcements carry a PDF or an image in `file`). Decides how it is shown under the
 * article text. Addresses are checked here because the value comes from WordPress: only https is ever used, and only files on
 * IGIHE's own hosts are embedded on the page; a file from anywhere else is offered as a plain link, never embedded.
 */
export type ArticleFileKind = 'pdf' | 'image' | 'other'

export interface ArticleFileView {
  url: string
  /** What an iframe should load. A PDF on a host that forbids being framed goes through our own address (/api/pdf). */
  embedUrl: string
  kind: ArticleFileKind
  /** Shown on the buttons and as the frame's description. */
  name: string
  /** True when it may be placed inside the page (iframe / img); false means link only. */
  embeddable: boolean
}

const OWN_HOST = /(^|\.)igihe\.com$/i

/**
 * Hosts whose PDFs may be shown in a frame directly: they send no X-Frame-Options (checked 2026-10-22 against cdn.igihe.com,
 * where the English WordPress offloads its uploads, and en-images.igihe.com, where the older notices live). Both must also be
 * allowed by the page's Content-Security-Policy frame-src (next.config.ts), or the browser leaves the frame blank.
 */
const FRAMEABLE_PDF_HOSTS = new Set(['spipimg.igihe.com', 'cdn.igihe.com', 'en-images.igihe.com'])

/**
 * WordPress hosts whose PDFs would go through a same-origin relay (/api/pdf) because WordPress forbids framing its own uploads.
 * This site has no relay route (its uploads are offloaded to cdn.igihe.com), so the set is empty and such a PDF is a link only.
 */
export const RELAYABLE_PDF_HOSTS: ReadonlySet<string> = new Set<string>()
export const RELAYABLE_PDF_PATH = /^\/(?:[a-z0-9-]+\/)?wp-content\/uploads\/[\w\-./%()+]+\.pdf$/i
const IMAGE_EXTENSION = /\.(?:png|jpe?g|webp|gif|avif)$/i

function nameFrom(url: URL, title: string | undefined): string {
  const clean = (title ?? '').trim()
  if (clean) return clean.slice(0, 120)
  const last = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '')
  return last.slice(0, 120) || 'file'
}

export function describeArticleFile(file: { url?: unknown; title?: unknown; mime_type?: unknown } | null | undefined): ArticleFileView | null {
  if (!file || typeof file.url !== 'string') return null
  let url: URL
  try {
    url = new URL(file.url.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.username || url.password) return null

  const mime = typeof file.mime_type === 'string' ? file.mime_type.toLowerCase() : ''
  const path = url.pathname
  const kind: ArticleFileKind =
    mime === 'application/pdf' || /\.pdf$/i.test(path) ? 'pdf' : mime.startsWith('image/') || IMAGE_EXTENSION.test(path) ? 'image' : 'other'

  const embeddable = kind !== 'other' && OWN_HOST.test(url.hostname)
  const host = url.hostname.toLowerCase()
  const embedUrl =
    kind === 'pdf' && embeddable && !FRAMEABLE_PDF_HOSTS.has(host) && RELAYABLE_PDF_HOSTS.has(host) && !url.search
      ? `/api/pdf?src=${encodeURIComponent(url.toString())}`
      : url.toString()

  return {
    url: url.toString(),
    embedUrl,
    kind,
    name: nameFrom(url, typeof file.title === 'string' ? file.title : undefined),
    // A PDF on some other IGIHE host that forbids framing and is not relayable cannot be shown inside the page: link only.
    embeddable: kind === 'pdf' ? embeddable && (FRAMEABLE_PDF_HOSTS.has(host) || embedUrl !== url.toString()) : embeddable,
  }
}
