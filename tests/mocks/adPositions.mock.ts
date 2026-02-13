import type { Advertisement } from './types.mock'



jest.mock('@/lib/adPositions', () => ({
  getAdsByPosition: jest.fn((ads: any[], position: string) => 
    ads.filter((ad: any) => ad.acf?.position === position)
  ),
}))

export type AdPositionKey = 'header' | 'sidebar' | 'footer' | 'inline'



export const getAdsByPosition = jest.fn(
  (ads: Advertisement[], position: AdPositionKey): Advertisement[] =>
    ads.filter((ad) => ad.acf?.position === position)
)