import { formatLastmod, maxDate, renderNewsUrlset, renderSitemapIndex, renderUrlset, stripTags, XML_DECLARATION } from '@/lib/sitemap/xml'

describe('sitemap XML rendering', () => {
  it('starts every document with the XML declaration', () => {
    expect(renderUrlset([]).startsWith(`${XML_DECLARATION}\n`)).toBe(true)
    expect(renderSitemapIndex([]).startsWith(`${XML_DECLARATION}\n`)).toBe(true)
    expect(renderNewsUrlset([], { name: 'IGIHE', language: 'en' }).startsWith(`${XML_DECLARATION}\n`)).toBe(true)
  })

  it('escapes URLs and titles', () => {
    const xml = renderNewsUrlset(
      [{ loc: 'https://en.igihe.com/news/article/a&b', title: 'Tom & "Jerry" <3', publicationDate: '2026-09-15T07:10:37Z' }],
      { name: 'IGIHE', language: 'en' }
    )
    expect(xml).toContain('<loc>https://en.igihe.com/news/article/a&amp;b</loc>')
    expect(xml).toContain('<news:title>Tom &amp; &quot;Jerry&quot; &lt;3</news:title>')
    expect(xml).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"')
    expect(xml).toContain('<news:name>IGIHE</news:name>')
    expect(xml).toContain('<news:language>en</news:language>')
    expect(xml).toContain('<news:publication_date>2026-09-15T07:10:37Z</news:publication_date>')
  })

  it('omits lastmod, changefreq and priority when absent', () => {
    const xml = renderUrlset([{ loc: 'https://en.igihe.com/author' }])
    expect(xml).not.toContain('<lastmod>')
    expect(xml).not.toContain('<changefreq>')
    expect(xml).not.toContain('<priority>')
  })

  it('renders a sitemap index with per-file lastmod', () => {
    const xml = renderSitemapIndex([
      { loc: 'https://en.igihe.com/sitemap-pages.xml', lastmod: '2026-09-15T08:00:00Z' },
      { loc: 'https://en.igihe.com/news-sitemap.xml' },
    ])
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('<sitemap>\n    <loc>https://en.igihe.com/sitemap-pages.xml</loc>\n    <lastmod>2026-09-15T08:00:00Z</lastmod>\n  </sitemap>')
    expect(xml).toContain('<sitemap>\n    <loc>https://en.igihe.com/news-sitemap.xml</loc>\n  </sitemap>')
  })

  it('formats WordPress GMT timestamps as W3C UTC datetimes without milliseconds', () => {
    expect(formatLastmod('2026-09-15T07:10:37')).toBe('2026-09-15T07:10:37Z')
    expect(formatLastmod('2026-09-15T07:10:37.123Z')).toBe('2026-09-15T07:10:37Z')
    expect(formatLastmod(new Date('2026-01-02T03:04:05.678Z'))).toBe('2026-01-02T03:04:05Z')
    expect(formatLastmod('not a date')).toBeUndefined()
    expect(formatLastmod(undefined)).toBeUndefined()
  })

  it('picks the newest of several timestamps (scheduled posts have modified < date)', () => {
    expect(maxDate('2026-09-15T07:10:37', '2026-09-10T00:00:00')).toBe('2026-09-15T07:10:37Z')
    expect(maxDate(undefined, '2026-09-10T00:00:00')).toBe('2026-09-10T00:00:00Z')
    expect(maxDate(undefined, null)).toBeUndefined()
  })

  it('strips markup and entities from titles', () => {
    expect(stripTags('&#8216;In Canada&#8217; &amp; <em>home</em>')).toBe('‘In Canada’ & home')
  })
})
