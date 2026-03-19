import { Advertisement } from "@/types/fetchData"

export const AD_POSITIONS = {
  // Header positions
  'premium_leaderboard_1': {
    name: 'Header Landscape Ad 1',
    description: 'Primary header banner',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 1,
    default:'landScap.webp'
  },
  'bellow-videos': {
    name: 'Header Landscape Ad 1',
    description: 'Primary header banner',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 1,
    default:'landScap.webp'
  },
  'top-of-categories-1': {
    name: 'Header Landscape Ad 1',
    description: 'Primary header banner',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 1,
    default:'landScap.webp'
  },
  'next-to-logo': {
    name: 'Header Landscape Ad 1',
    description: 'Primary header banner',
    dimensions: { width: 728, height: 96,ratio:'770/95' },
    priority: 1,
    default:'landScap.webp'
  },
  'above-latest-news-1': {
    name: 'Header Landscape Ad 1',
    description: 'Primary header banner',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 1,
    default:'landScap.webp'
  },
  'above-latest-news-2': {
    name: 'Header Landscape Ad 1',
    description: 'Primary header banner',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 1,
    default:'landScap.webp'
  },

  'top-of-categories-2': {
    name: 'Header Landscape Ad 1',
    description: 'Primary header banner',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 1,
    default:'landScap.webp'
  },
  'inside-of-categories-1': {
    name: 'Header Landscape Ad 1',
    description: 'Primary header banner',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 1,
    default:'landScap.webp'
  },
  'inside-of-categories-2': {
    name: 'Header Landscape Ad 1',
    description: 'Primary header banner',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 1,
    default:'landScap.webp'
  },

  'ad1_leaderboard_728x90': {
    name: 'Header Landscape Ad 2',
    description: 'Secondary header banner',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 2,
    default:'landScap.webp'
  },

  'mot-premium_leaderboard_1_b': {
    name: 'Header Landscape Ad 2',
    description: 'Secondary header banner',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 2,
    default:'landScap.webp'
  },

  'header-landscape-ad-2': {
    name: 'Header Landscape Ad 2',
    description: 'Secondary header banner',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 2,
    default:'landScap.webp'
  },

  // Homepage positions
  'home-featured': {
    name: 'Home Featured',
    description: 'Featured section on homepage',
    dimensions: { width: 300, height: 250,ratio:'6/5' },
    priority: 1,
    default:'squar.webp'
  },
  'after-announcements': {
    name: 'after announcements',
    description: 'after-announcements',
    dimensions: { width: 300, height: 250,ratio:'6/5' },
    priority: 1,
    default:'squar.webp'
  },
  'after-opinions': {
    name: 'after-opinions',
    description: 'after-opinions',
    dimensions: { width: 300, height: 250,ratio:'6/5' },
    priority: 1,
    default:'squar.webp'
  },
  'after-facts': {
    name: 'after announcements',
    description: 'after-announcements',
    dimensions: { width: 300, height: 250,ratio:'6/5' },
    priority: 1,
    default:'squar.webp'
  },

  'home-after-highlights': {
    name: 'Home After Highlights',
    description: 'After highlights section',
    dimensions: { width: 728, height: 250,ratio:'6/5' },
    priority: 2,
    default:'squar.webp'
  },
  'beside-igihe-logo': {
    name: 'Beside Igihe Logo',
    description: 'Beside Igihe Logo',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 2,
    default:'landScap.webp'
  },

  'home-bellow-hights': {
    name: 'Home bellow Highlights',
    description: 'bellow highlights section',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 2,
    default:'landScap.webp'
  },
  'home-bellow-hights-2': {
    name: 'Home bellow Highlights',
    description: 'bellow highlights section',
    dimensions: { width: 728, height: 96,ratio:'770/99' },
    priority: 2,
    default:'landScap.webp'
  },
  'bellow-featured-news': {
    name: 'Home bellow Featured',
    description: 'bellow Featured section',
    dimensions: { width: 850, height: 91,ratio:'770/99' },
    priority: 2,
    default:'landScap.webp'
  },
  'home-section-1': {
    name: 'Home Section 1',
    description: 'First content section',
    dimensions: { width: 300, height: 250,ratio:'6/5' },
    priority: 3,
    default:'squar.webp'
  },
  'midle-large-size-add': {
    name: 'Home Section 1',
    description: 'First content section',
    dimensions: { width: 300, height: 250,ratio:'2/1' },
    priority: 3,
    default:'bigLarg.webp'
  },

  // No positioned ads
  'no-positioned': {
    name: 'No Position',
    description: 'Ads without specific position',
    dimensions: { width: 300, height: 250,ratio:'6/5' },
    priority: 99,
    default:'squar.webp'
  }
} as const

export type AdPositionKey = keyof typeof AD_POSITIONS

export function getAdPositionFromClassList(classList: string[]): AdPositionKey | null {
  for (const className of classList) {
    if (className.startsWith('tag-')) {
      const position = className.replace('tag-', '') as AdPositionKey
      if (position in AD_POSITIONS) {
        return position
      }
    }
  }
  return null
}

export function getAdPositionsFromClassList(classList: string[]): AdPositionKey[] {
  return classList
    .filter(className => className.startsWith('tag-'))
    .map(className => className.replace('tag-', '') as AdPositionKey)
    .filter(position => position in AD_POSITIONS)
}

// export function getAdsByPosition(ads: Advertisement[], position: AdPositionKey): Advertisement[] {
//   // console.log(ads)
//   return ads
//     .filter(ad => getAdPositionFromClassList(ad.class_list) === position)
//     .sort((a, b) => b.menu_order - a.menu_order) // Higher menu_order first
// }

export function getAdsByPosition(ads: Advertisement[], position: AdPositionKey): Advertisement[] {
  return ads
    .filter(ad => 
      ad.class_list.some(className => className === `tag-${position}`)
    )
    .sort((a, b) => b.menu_order - a.menu_order)
}