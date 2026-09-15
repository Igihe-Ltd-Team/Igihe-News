import { damerauLevenshtein, findAuthorAliasGroups, normalizeAuthorKey } from '@/lib/sitemap/authors'
import type { BylineRecord } from '@/lib/sitemap/types'

const b = (id: number, slug: string, count: number): BylineRecord => ({ id, slug, name: slug, count })

describe('author alias detection', () => {
  it('normalises suffixes, honorifics and punctuation', () => {
    expect(normalizeAuthorKey('al-jazeera-3')).toBe('aljazeera')
    expect(normalizeAuthorKey('dr-donald-kaberuka')).toBe('donaldkaberuka')
    expect(normalizeAuthorKey('h-e-jeannette-kagame')).toBe('jeannettekagame')
    expect(normalizeAuthorKey('by-sam-k-nkurunziza')).toBe('samknkurunziza')
    expect(normalizeAuthorKey('574')).toBe('')
  })

  it('computes edit distance with transpositions', () => {
    expect(damerauLevenshtein('centre', 'center', 2)).toBe(1)
    expect(damerauLevenshtein('aljazeera', 'aljaazeera', 2)).toBe(1)
    expect(damerauLevenshtein('abcnews', 'cbcnews', 2)).toBe(1)
    expect(damerauLevenshtein('short', 'completely-different', 2)).toBe(3)
  })

  it('groups the al-jazeera spellings under the most-used slug', () => {
    const { auto } = findAuthorAliasGroups([
      b(1, 'al-jazeera', 2558), b(2, 'aljazeera', 5), b(3, 'al-azeera', 2), b(4, 'al-jazeeera', 2),
      b(5, 'al-j-azeera', 1), b(6, 'al-jaazeera', 1), b(7, 'al-jazeer', 1), b(8, 'al-jazeera-3', 1),
      b(9, 'al-jjazeera', 1), b(10, 'al-jzeera', 1), b(11, 'xinhua', 2450),
    ])
    expect(auto).toHaveLength(1)
    expect(auto[0].canonical.slug).toBe('al-jazeera')
    expect(auto[0].aliases.map(a => a.slug).sort()).toEqual(
      ['al-azeera', 'al-j-azeera', 'al-jaazeera', 'al-jazeeera', 'al-jazeer', 'al-jazeera-3', 'al-jjazeera', 'al-jzeera', 'aljazeera']
    )
  })

  it('does not merge different outlets whose short names are one letter apart', () => {
    const { auto, review } = findAuthorAliasGroups([b(1, 'abc-news', 23), b(2, 'cbc-news', 5), b(3, 'nbc-news', 1), b(4, 'us-news', 5), b(5, 'un-news', 3)])
    expect(auto).toEqual([])
    expect(review).toEqual([])
  })

  it('recognises swapped given/family name order', () => {
    const { auto } = findAuthorAliasGroups([
      b(1, 'thamimu-hakizimana', 5), b(2, 'hakizimana-thamim', 5), b(3, 'thamim-hakizimana', 4), b(4, 'hakizimana-thamimu', 1),
      b(5, 'jean-damour-nsabimana-2', 48), b(6, 'nsabimana-jean-damour', 12), b(7, 'jean-damour-nsabimana', 21),
    ])
    expect(auto.map(g => [g.canonical.slug, g.aliases.map(a => a.slug).sort()])).toEqual([
      ['jean-damour-nsabimana-2', ['jean-damour-nsabimana', 'nsabimana-jean-damour']],
      ['hakizimana-thamim', ['hakizimana-thamimu', 'thamim-hakizimana', 'thamimu-hakizimana']],
    ])
  })

  it('applies honorific and suffix variants as exact matches and flags two-edit names for review', () => {
    const { auto, review } = findAuthorAliasGroups([
      b(1, 'donald-kaberuka', 4), b(2, 'dr-donald-kaberuka', 1),
      b(3, 'elisee-mpirwa', 26), b(4, 'elisha-mpirwa', 2),
    ])
    expect(auto).toEqual([expect.objectContaining({ confidence: 'exact', canonical: expect.objectContaining({ slug: 'donald-kaberuka' }) })])
    expect(review).toEqual([expect.objectContaining({ canonical: expect.objectContaining({ slug: 'elisee-mpirwa' }), aliases: [expect.objectContaining({ slug: 'elisha-mpirwa' })] })])
  })
})
