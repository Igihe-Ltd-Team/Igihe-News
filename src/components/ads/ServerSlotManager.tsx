import { AdPositionKey } from "@/lib/adPositions"
import { ApiService } from "@/services/apiService"
import AdUnit from "./AdUnit"

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

async function getSlot(position:AdPositionKey) {
  try {
    const res = await ApiService.fetchAdsByPosition(position)

    return res
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export default async function ServerSlotManager({ 
  position, 
  className = '', 
  priority = false,
  maxAds = 1,
  showLabel = true,
  fallbackComponent,
  imgClass,
  retryCount = 2
}: AdManagerProps) {
  const slots = await getSlot(position)
const slotsToShow = slots.slice(0, maxAds)

// console.log('selected adds position: ',position,slotsToShow)

return(
<div className={`slot-position tag-${position} ${className}`}>
      {slotsToShow.map((ad, index) => (
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