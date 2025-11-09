import { Advertisement } from "@/types/fetchData"

export const AD_POSITIONS = {
  // Header positions
  'header-landscape-ad-1': {
    name: 'Header Landscape Ad 1',
    description: 'Primary header banner',
    dimensions: { width: 728, height: 90 },
    priority: 1
  },
  'header-landscape-ad-2': {
    name: 'Header Landscape Ad 2',
    description: 'Secondary header banner',
    dimensions: { width: 728, height: 90 },
    priority: 2
  },
  
  // Homepage positions
  'home-featured': {
    name: 'Home Featured',
    description: 'Featured section on homepage',
    dimensions: { width: 300, height: 250 },
    priority: 1
  },
  'home-after-highlights': {
    name: 'Home After Highlights',
    description: 'After highlights section',
    dimensions: { width: 300, height: 250 },
    priority: 2
  },
  'home-section-1': {
    name: 'Home Section 1',
    description: 'First content section',
    dimensions: { width: 300, height: 250 },
    priority: 3
  },
  
  // No positioned ads
  'no-positioned': {
    name: 'No Position',
    description: 'Ads without specific position',
    dimensions: { width: 300, height: 250 },
    priority: 99
  }
} as const

export type AdPositionKey = keyof typeof AD_POSITIONS

export function getAdPositionFromClassList(classList: string[]): AdPositionKey | null {
  for (const className of classList) {
    if (className.startsWith('ads-position-')) {
      const position = className.replace('ads-position-', '') as AdPositionKey
      if (position in AD_POSITIONS) {
        return position
      }
    }
  }
  return 'no-positioned'
}

export function getAdsByPosition(ads: Advertisement[], position: AdPositionKey): Advertisement[] {
  return ads
    .filter(ad => getAdPositionFromClassList(ad.class_list) === position)
    .sort((a, b) => b.menu_order - a.menu_order) // Higher menu_order first
}