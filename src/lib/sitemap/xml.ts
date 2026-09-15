import type { NewsSitemapUrl, SitemapFileRef, SitemapUrl } from './types.ts'

export const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>'
const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
const NEWS_NS = 'http://www.google.com/schemas/sitemap-news/0.9'

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Normalises any date input to W3C datetime in UTC with second precision
 * (`2026-09-15T07:10:37Z`). WordPress `*_gmt` fields arrive without a zone
 * suffix; they are UTC and are treated as such. Returns undefined for
 * unparseable input so callers omit <lastmod> instead of emitting garbage.
 */
export function formatLastmod(input: string | Date | null | undefined): string | undefined {
  if (!input) return undefined
  const date = input instanceof Date ? input : parseUtc(input)
  if (!date || Number.isNaN(date.getTime())) return undefined
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** Parses an ISO string; a bare `YYYY-MM-DDTHH:MM:SS` is interpreted as UTC. */
export function parseUtc(value: string): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  const bare = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(trimmed)
  const date = new Date(bare ? `${trimmed}Z` : trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

export function maxDate(...values: Array<string | null | undefined>): string | undefined {
  let best: Date | null = null
  for (const value of values) {
    if (!value) continue
    const date = parseUtc(value)
    if (date && (!best || date > best)) best = date
  }
  return best ? formatLastmod(best) : undefined
}

function renderUrl(url: SitemapUrl): string {
  const parts = [`    <loc>${escapeXml(url.loc)}</loc>`]
  if (url.lastmod) parts.push(`    <lastmod>${url.lastmod}</lastmod>`)
  if (url.changefreq) parts.push(`    <changefreq>${url.changefreq}</changefreq>`)
  if (typeof url.priority === 'number') parts.push(`    <priority>${url.priority.toFixed(1)}</priority>`)
  return `  <url>\n${parts.join('\n')}\n  </url>`
}

export function renderUrlset(urls: SitemapUrl[]): string {
  return `${XML_DECLARATION}\n<urlset xmlns="${SITEMAP_NS}">\n${urls.map(renderUrl).join('\n')}\n</urlset>\n`
}

export function renderSitemapIndex(files: SitemapFileRef[]): string {
  const body = files
    .map(file => {
      const lastmod = file.lastmod ? `\n    <lastmod>${file.lastmod}</lastmod>` : ''
      return `  <sitemap>\n    <loc>${escapeXml(file.loc)}</loc>${lastmod}\n  </sitemap>`
    })
    .join('\n')
  return `${XML_DECLARATION}\n<sitemapindex xmlns="${SITEMAP_NS}">\n${body}\n</sitemapindex>\n`
}

export function renderNewsUrlset(
  urls: NewsSitemapUrl[],
  publication: { name: string; language: string }
): string {
  const body = urls
    .map(url => {
      const lastmod = url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ''
      return `  <url>
    <loc>${escapeXml(url.loc)}</loc>${lastmod}
    <news:news>
      <news:publication>
        <news:name>${escapeXml(publication.name)}</news:name>
        <news:language>${escapeXml(publication.language)}</news:language>
      </news:publication>
      <news:publication_date>${url.publicationDate}</news:publication_date>
      <news:title>${escapeXml(url.title)}</news:title>
    </news:news>
  </url>`
    })
    .join('\n')
  return `${XML_DECLARATION}\n<urlset xmlns="${SITEMAP_NS}" xmlns:news="${NEWS_NS}">\n${body}\n</urlset>\n`
}

/** Minimal HTML-to-text for titles coming out of WordPress `title.rendered`. */
export function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8216;|&lsquo;/g, '‘')
    .replace(/&#8220;|&ldquo;/g, '“')
    .replace(/&#8221;|&rdquo;/g, '”')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}
