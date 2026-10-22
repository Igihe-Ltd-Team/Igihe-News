'use client'

import { useSiteContent } from '@/components/siteContent/SiteContentProvider'
import { describeArticleFile } from '@/lib/articleFile'
import type { NewsItem } from '@/types/fetchData'

/**
 * The file an article carries (an announcement's PDF or picture), shown under the article text. A PDF opens in a viewer
 * inside the page, a picture is shown at full width. Every case also has Open and Download buttons: phone browsers often
 * cannot show a PDF inside a page, and the buttons are then the way to read it.
 */
export default function ArticleFileEmbed({ file, title }: { file: NewsItem['file']; title: string }) {
  const content = useSiteContent()
  const view = describeArticleFile(file)
  if (!view) return null

  const label = view.name
  const buttons = (
    <div className="d-flex flex-wrap gap-2 mt-3">
      <a className="btn btn-primary btn-sm" href={view.url} target="_blank" rel="noopener noreferrer">
        <i className="bi bi-box-arrow-up-right me-1" aria-hidden="true" />
        {content.get('article.file.open')}
      </a>
      <a className="btn btn-outline-secondary btn-sm" href={view.url} download>
        <i className="bi bi-download me-1" aria-hidden="true" />
        {content.get('article.file.download')}
      </a>
    </div>
  )

  return (
    <section className="article-file pt-4" aria-label={label}>
      {view.embeddable && view.kind === 'pdf' && (
        <iframe
          title={label}
          src={`${view.embedUrl}#view=FitH`}
          className="w-100 d-block border rounded"
          style={{ height: 'min(80vh, 900px)', minHeight: 420, background: '#fff' }}
        />
      )}
      {view.embeddable && view.kind === 'image' && (
        <a href={view.url} target="_blank" rel="noopener noreferrer" className="d-block">
          {/* Loaded straight away, not lazily: for an announcement this file IS the content. A plain img on purpose: these are notices, often large PNGs, and Next's image optimiser would re-encode each one on the server. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={view.url} alt={label || title} decoding="async" className="d-block mw-100 h-auto mx-auto border rounded" />
        </a>
      )}
      {!view.embeddable && <p className="text-muted mb-0">{label}</p>}
      {buttons}
    </section>
  )
}
