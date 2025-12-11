// 'use client'

// import { useAdsByPosition, useAdsFromCache } from '@/hooks/useMainNewsData'
// import AdUnit from './AdUnit'
// import { AdPositionKey } from '@/lib/adPositions'
// import { useEffect, useState, useMemo } from 'react'

// interface AdManagerProps {
//   position: AdPositionKey
//   className?: string
//   priority?: boolean
//   maxAds?: number
//   showLabel?: boolean
//   fallbackComponent?: React.ReactNode
//   imgClass?: string
//   enableLazyLoad?: boolean
// }

// export default function AdManager({
//   position,
//   className = '',
//   priority = false,
//   maxAds = 1,
//   showLabel = true,
//   fallbackComponent,
//   imgClass,
//   enableLazyLoad = false
// }: AdManagerProps) {
//   const [isInView, setIsInView] = useState(!enableLazyLoad)

//   // Try to get ads from prefetched cache first
//   const cachedAds = useAdsFromCache(position)

//   // Query for ads (will use cache if available)
//   const {
//     data: queryAds,
//     isLoading,
//     error
//   } = useAdsByPosition(position, isInView)

//   // Use cached ads if available, otherwise use query data
//   const ads = cachedAds || queryAds

//   // Intersection Observer for lazy loading
//   useEffect(() => {
//     if (!enableLazyLoad) return

//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             setIsInView(true)
//           }
//         })
//       },
//       { rootMargin: '200px' }
//     )

//     const element = document.querySelector(`[data-ad-position="${position}"]`)
//     if (element) {
//       observer.observe(element)
//     }

//     return () => observer.disconnect()
//   }, [enableLazyLoad, position])

//   // Memoize ads to show
//   const adsToShow = useMemo(() => {
//     return ads?.slice(0, maxAds) || []
//   }, [ads, maxAds])

//   // Placeholder for lazy-loaded ads
//   if (enableLazyLoad && !isInView) {
//     return (
//       <div
//         className={`slot-position slot-${position} ${className}`}
//         data-ad-position={position}
//         style={{ minHeight: '100px' }}
//       />
//     )
//   }

//   // Loading state - only if no cached data
//   if (isLoading && !ads) {
//     return (
//       <div
//         className={`slot-position slot-${position} ${className}`}
//         data-ad-position={position}
//         style={{ minHeight: '100px' }}
//       />
//     )
//   }

//   // Error or no ads
//   if ((error && !ads) || !ads || ads.length === 0) {
//     return fallbackComponent ? <>{fallbackComponent}</> : null
//   }

//   return (
//     <div
//       className={`slot-position slot-${position} ${className}`}
//       data-ad-position={position}
//     >
//       {adsToShow.map((ad, index) => (
//         <AdUnit
//           key={ad.id}
//           ad={ad}
//           position={position}
//           priority={priority && index === 0}
//           showLabel={showLabel}
//           className={index > 0 ? 'mt-3' : ''}
//           imgClass={imgClass}
//         />
//       ))}
//     </div>
//   )
// }




'use client'

import { useQuery } from '@tanstack/react-query'
import { ApiService } from '@/services/apiService'
import AdUnit from './AdUnit'
import { queryKeys } from '@/lib/queryKeys'
import { AdPositionKey } from '@/lib/adPositions'
import { Spinner } from 'react-bootstrap'
import { useEffect } from 'react'

interface AdManagerProps {
  position: AdPositionKey
  className?: string
  priority?: boolean
  maxAds?: number
  showLabel?: boolean
  fallbackComponent?: React.ReactNode
  imgClass?:string
  retryCount?:number
}

export default function AdManager({ 
  position, 
  className = '', 
  priority = false,
  maxAds = 1,
  showLabel = true,
  fallbackComponent,
  imgClass,
  retryCount = 2
}: AdManagerProps) {
  const { data: ads, isLoading, error,refetch } = useQuery({
    queryKey: queryKeys.ads.byPosition(position),
    queryFn: () => ApiService.fetchAdsByPosition(position),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })


  useEffect(() => {
    if (error && retryCount > 0) {
      const timer = setTimeout(() => {
        refetch();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [error, refetch, retryCount]);
  

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
    <div className={`slot-position slot-${position} ${className}`}>
      {adsToShow.map((ad, index) => (
        <AdUnit
          key={ad.id}
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




