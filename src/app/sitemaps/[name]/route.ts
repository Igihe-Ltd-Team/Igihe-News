// Serves the pre-generated sitemap files. Public URLs are rewritten here by
// next.config.ts:
//   /sitemap-index.xml, /sitemap.xml  -> /sitemaps/index
//   /sitemap-<name>.xml               -> /sitemaps/<name>
// Files are produced by src/lib/sitemap/generate.ts (see docs/sitemaps.md).

import { NextResponse } from 'next/server'
import { loadManifest, readStoreFile, sitemapFileName } from '@/lib/sitemap/store'
import { requestSitemapRegeneration } from '@/lib/sitemap/scheduler'
import { XML_DECLARATION } from '@/lib/sitemap/xml'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const NAME_PATTERN = /^(index|pages|categories|videos|authors|articles-[1-9]\d*)$/

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params
  if (!NAME_PATTERN.test(name)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const [xml, manifest] = await Promise.all([readStoreFile(sitemapFileName(name)), loadManifest()])

  if (!xml || !xml.startsWith(XML_DECLARATION)) {
    // Nothing generated yet (first boot) or the file is being rewritten.
    requestSitemapRegeneration(`cold-start:${name}`)
    return new NextResponse('Sitemap is being generated, retry shortly', {
      status: 503,
      headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' },
    })
  }

  const file = manifest.files[name]
  const headers: Record<string, string> = {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600',
    'X-Robots-Tag': 'noindex',
  }
  if (file?.lastmod) headers['Last-Modified'] = new Date(file.lastmod).toUTCString()
  if (manifest.generatedAt) headers['X-Sitemap-Generated-At'] = manifest.generatedAt
  if (file) headers['X-Sitemap-Url-Count'] = String(file.urlCount)

  return new NextResponse(xml, { status: 200, headers })
}
