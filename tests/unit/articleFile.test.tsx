import { renderToStaticMarkup } from 'react-dom/server'
import { describeArticleFile } from '@/lib/articleFile'
import ArticleFileEmbed from '../../src/components/news/ArticleFileEmbed'

// The shapes WordPress really sends in `file` for announcements on the English site (see the announcement endpoint).
const CDN_PDF = {
  id: 2000130103,
  url: 'https://cdn.igihe.com/en/2026/10/RAIA_Senior_Environmental_Specialist_Approved_Format.pdf',
  title: 'RAIA_Senior_Environmental_Specialist_Approved_Format',
  mime_type: 'application/pdf',
}
const LEGACY_PDF = { id: 2000092966, url: 'https://en-images.igihe.com/IMG/pdf/amstel_new_pack_press_release_compressed.pdf', title: '', mime_type: 'application/pdf' }
const PNG = { id: 1, url: 'https://cdn.igihe.com/en/2026/10/Announcement-AAA-2.png', title: 'Announcement AAA', mime_type: 'image/png' }

describe('describeArticleFile', () => {
  it('embeds a PDF from the CDN the English WordPress uploads to, named from its title', () => {
    expect(describeArticleFile(CDN_PDF)).toEqual({ url: CDN_PDF.url, embedUrl: CDN_PDF.url, kind: 'pdf', name: CDN_PDF.title, embeddable: true })
  })

  it('embeds an older notice from en-images.igihe.com and names it from the file name when it has no title', () => {
    expect(describeArticleFile(LEGACY_PDF)).toEqual({
      url: LEGACY_PDF.url,
      embedUrl: LEGACY_PDF.url,
      kind: 'pdf',
      name: 'amstel_new_pack_press_release_compressed.pdf',
      embeddable: true,
    })
  })

  it('shows an image on an IGIHE host and uses its title as the name', () => {
    expect(describeArticleFile(PNG)).toEqual({ url: PNG.url, embedUrl: PNG.url, kind: 'image', name: 'Announcement AAA', embeddable: true })
  })

  it('works out the kind from the address when WordPress sends no mime type', () => {
    expect(describeArticleFile({ url: 'https://cdn.igihe.com/en/a.PDF' })?.kind).toBe('pdf')
    expect(describeArticleFile({ url: 'https://cdn.igihe.com/en/a.jpg' })?.kind).toBe('image')
  })

  it('offers anything else (Word, Excel...) as a link only', () => {
    expect(describeArticleFile({ url: 'https://cdn.igihe.com/en/a.docx', mime_type: 'application/msword' })).toMatchObject({ kind: 'other', embeddable: false })
  })

  it('offers a PDF on a WordPress host as a link only: WordPress forbids framing its uploads and this site has no relay', () => {
    const wp = { url: 'https://new.igihe.com/english/wp-content/uploads/2026/10/TENDER-NOTICE.pdf', mime_type: 'application/pdf' }
    expect(describeArticleFile(wp)).toMatchObject({ kind: 'pdf', embeddable: false, embedUrl: wp.url })
    expect(describeArticleFile({ url: 'https://other.igihe.com/files/a.pdf', mime_type: 'application/pdf' })).toMatchObject({ embeddable: false })
  })

  it('never embeds a file from another site (link only), and never uses a non-https address', () => {
    expect(describeArticleFile({ url: 'https://evil.example/a.pdf', mime_type: 'application/pdf' })).toMatchObject({ kind: 'pdf', embeddable: false })
    expect(describeArticleFile({ url: 'https://notigihe.com/a.pdf' })).toMatchObject({ embeddable: false })
    expect(describeArticleFile({ url: 'https://igihe.com.evil.example/a.pdf' })).toMatchObject({ embeddable: false })
    for (const url of ['http://cdn.igihe.com/a.pdf', 'javascript:alert(1)', 'data:application/pdf;base64,AAAA', 'ftp://igihe.com/a.pdf', 'https://user:pw@cdn.igihe.com/a.pdf', '//cdn.igihe.com/a.pdf', 'not a url', '']) {
      expect(describeArticleFile({ url })).toBeNull()
    }
  })

  it('has nothing for a missing file', () => {
    for (const value of [null, undefined, {}, { url: 5 }, { url: null }]) expect(describeArticleFile(value as never)).toBeNull()
  })
})

describe('ArticleFileEmbed', () => {
  const render = (file: unknown) => renderToStaticMarkup(<ArticleFileEmbed file={file as never} title="Title" />)

  it('shows a PDF in a viewer, with Open and Download', () => {
    const html = render(CDN_PDF)
    expect(html).toContain('<iframe')
    expect(html).toContain(`src="${CDN_PDF.url}#view=FitH"`)
    expect(html).toContain('>Open<')
    expect(html).toContain('>Download<')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('shows an image at full width, with Open and Download', () => {
    const html = render(PNG)
    expect(html).toContain('<img')
    expect(html).toContain(`src="${PNG.url}"`)
    expect(html).toContain('alt="Announcement AAA"')
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('loading="lazy"') // it is the content of the page, not something below it
  })

  it('only links to a file from another site', () => {
    const html = render({ url: 'https://evil.example/a.pdf', mime_type: 'application/pdf' })
    expect(html).not.toContain('<iframe')
    expect(html).not.toContain('<img')
    expect(html).toContain('href="https://evil.example/a.pdf"')
  })

  it('renders nothing when the article has no file', () => {
    expect(render(null)).toBe('')
    expect(render(undefined)).toBe('')
    expect(render({ url: 'javascript:alert(1)' })).toBe('')
  })
})
