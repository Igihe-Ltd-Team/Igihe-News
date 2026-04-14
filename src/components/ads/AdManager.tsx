// import { AdPositionKey } from "@/lib/adPositions"
// import { ApiService } from "@/services/apiService"
// import AdUnit from "./AdUnit"

// interface AdManagerProps {
//   position: AdPositionKey
//   className?: string
//   priority?: boolean
//   maxAds?: number
//   showLabel?: boolean
//   fallbackComponent?: React.ReactNode
//   imgClass?:string
//   retryCount?:number
// }

// async function getSlot(position:AdPositionKey) {
//   try {
//     const res = await ApiService.fetchAdsByPosition(position)
//     return res
//   } catch (error) {
//     console.error('Error fetching categories:', error)
//     return []
//   }
// }

// export default async function AdManager({ 
//   position, 
//   className = '', 
//   priority = false,
//   maxAds = 1,
//   showLabel = true,
//   fallbackComponent,
//   imgClass,
//   retryCount = 2
// }: AdManagerProps) {
//   const slots = await getSlot(position)
// const slotsToShow = slots.slice(0, maxAds)
// return(
// <div className={`slot-position slot-${position} ${className}`}>
//       {slotsToShow.map((ad, index) => (
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
// )
// }



'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
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



export function useRealtimeCacheInvalidation() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    // Listen for revalidation events (if using WebSockets/SSE)
    // Or poll the server for cache version
    const checkForUpdates = async () => {
      // You could store a "cache version" in localStorage or check an endpoint
    }
    
    // For now, you can invalidate all ad queries when the page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Optional: Invalidate ads after 5 seconds of visibility
        setTimeout(() => {
          queryClient.invalidateQueries({ 
            queryKey: ['ads'] 
          })
        }, 1000)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [queryClient])
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
    staleTime: 30 * 1000, // 5 minutes
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
    <div className={`slot-position tag-${position} ${className}`}>
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
