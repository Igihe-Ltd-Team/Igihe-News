import { NewsItem } from '@/types/fetchData'

function newsItemKey(item: NewsItem): string | null {
  if (item.id) return `id:${item.id}`
  if (item.slug) return `slug:${item.slug}`
  return null
}

export function uniqueNewsItems(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>()

  return items.filter(item => {
    const key = newsItemKey(item)
    if (!key) return true
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function mergeUniqueNewsItems(current: NewsItem[], incoming: NewsItem[]): NewsItem[] {
  return uniqueNewsItems([...current, ...incoming])
}
