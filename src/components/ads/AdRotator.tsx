'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiService } from '@/services/apiService'
import AdUnit from './AdUnit'
import { queryKeys } from '@/lib/queryKeys'
import { AdPositionKey } from '@/lib/adPositions'

interface AdRotatorProps {
  position: AdPositionKey
  rotationInterval?: number // in milliseconds
  className?: string
  priority?: boolean
}

export default function AdRotator({ 
  position, 
  rotationInterval = 30000, // 30 seconds
  className = '',
  priority = false 
}: AdRotatorProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  
  const { data: ads, isLoading } = useQuery({
    queryKey: queryKeys.ads.byPosition(position),
    queryFn: () => ApiService.fetchAdsByPosition(position),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!ads || ads.length <= 1) return

    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % ads.length)
    }, rotationInterval)

    return () => clearInterval(interval)
  }, [ads, rotationInterval])

  if (isLoading || !ads || ads.length === 0) {
    return null
  }

  const currentAd = ads[currentAdIndex]

  return (
    <div className={`ad-rotator ad-${position} ${className}`}>
      <AdUnit 
        ad={currentAd} 
        position={position} 
        priority={priority}
      />
      {ads.length > 1 && (
        <div className="ad-rotator-indicator text-center mt-1">
          <small className="text-muted">
            Ad {currentAdIndex + 1} of {ads.length}
          </small>
        </div>
      )}
    </div>
  )
}