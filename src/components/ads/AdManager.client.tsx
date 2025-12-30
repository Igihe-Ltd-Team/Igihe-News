'use client'

import { useQuery } from '@tanstack/react-query'
import { ApiService } from '@/services/apiService'
import AdUnit from './AdUnit'
import { queryKeys } from '@/lib/queryKeys'
import { AdPositionKey } from '@/lib/adPositions'
import { useEffect, useState } from 'react'

interface AdManagerClientProps {
  position: AdPositionKey
  className?: string
  priority?: boolean
  maxAds?: number
  showLabel?: boolean
  fallbackComponent?: React.ReactNode
  imgClass?: string
  retryCount?: number
  initialAds?: any[] // Server-fetched ads for hydration
  enableRefetch?: boolean // Whether to enable client-side refetching
}

export default function AdManagerClient({
  position,
  className = '',
  priority = false,
  maxAds = 1,
  showLabel = true,
  fallbackComponent,
  imgClass,
  retryCount = 2,
  initialAds,
  enableRefetch = true
}: AdManagerClientProps) {
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  // Enable refetching only after component mounts
  const shouldFetch = enableRefetch && isMounted

  const { data: ads, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.ads.byPosition(position),
    queryFn: () => ApiService.fetchAdsByPosition(position),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    initialData: initialAds, // Use server-fetched data as initial data
    enabled: shouldFetch // Only fetch on client if enabled
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (error && retryAttempt < retryCount && shouldFetch) {
      const timer = setTimeout(() => {
        refetch()
        setRetryAttempt(prev => prev + 1)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [error, refetch, retryCount, retryAttempt, shouldFetch])

  // Always show initial data while loading or if refetching is disabled
  const displayAds = ads || initialAds || []

  // If we have data (either from server or client), show it
  if (displayAds.length > 0) {
    const adsToShow = displayAds.slice(0, maxAds)
    
    return (
      <div className={`slot-position slot-${position} ${className}`}>
        {adsToShow.map((ad, index) => (
          <AdUnit
            key={`${ad.id}-${index}-${isMounted ? 'client' : 'server'}`}
            ad={ad}
            position={position}
            priority={priority && index === 0}
            showLabel={showLabel}
            className={index > 0 ? 'mt-3' : ''}
            imgClass={imgClass}
          />
        ))}
      </div>
    )
  }

  // Show loading state only if we don't have initial data and are fetching
  if (isLoading && !initialAds && shouldFetch) {
    return <></>
  }

  // Handle errors
  if (error && !initialAds) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>
    }
    return null
  }

  // No ads and no error
  if (fallbackComponent) {
    return <>{fallbackComponent}</>
  }
  
  return null
}