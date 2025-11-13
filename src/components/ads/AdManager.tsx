'use client'

import { useQuery } from '@tanstack/react-query'
import { ApiService } from '@/services/apiService'
import AdUnit from './AdUnit'
import { queryKeys } from '@/lib/queryKeys'
import { AdPositionKey } from '@/lib/adPositions'
import { Spinner } from 'react-bootstrap'

interface AdManagerProps {
  position: AdPositionKey
  className?: string
  priority?: boolean
  maxAds?: number
  showLabel?: boolean
  fallbackComponent?: React.ReactNode
}

export default function AdManager({ 
  position, 
  className = '', 
  priority = false,
  maxAds = 1,
  showLabel = true,
  fallbackComponent
}: AdManagerProps) {
  const { data: ads, isLoading, error } = useQuery({
    queryKey: queryKeys.ads.byPosition(position),
    queryFn: () => ApiService.fetchAdsByPosition(position),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return (
      <></>
    )
  }

  if (error || !ads || ads.length === 0) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>
    }
    return null
  }

  const adsToShow = ads.slice(0, maxAds)

  return (
    <div className={`ad-position ad-${position} ${className}`}>
      {adsToShow.map((ad, index) => (
        <AdUnit
          key={ad.id}
          ad={ad}
          position={position}
          priority={priority && index === 0}
          showLabel={showLabel}
          className={index > 0 ? 'mt-3' : ''}
        />
      ))}
    </div>
  )
}