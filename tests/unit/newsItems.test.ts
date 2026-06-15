import { mergeUniqueNewsItems, uniqueNewsItems } from '@/lib/newsItems'
import { NewsItem } from '@/types/fetchData'

const item = (id: number, slug = `article-${id}`) => ({ id, slug } as NewsItem)

describe('news item deduplication', () => {
  it('removes duplicate IDs while preserving order', () => {
    expect(uniqueNewsItems([item(1), item(2), item(1)])).toEqual([item(1), item(2)])
  })

  it('merges overlapping pagination results without duplicate IDs', () => {
    expect(mergeUniqueNewsItems(
      [item(1), item(2)],
      [item(2), item(3)]
    )).toEqual([item(1), item(2), item(3)])
  })
})
