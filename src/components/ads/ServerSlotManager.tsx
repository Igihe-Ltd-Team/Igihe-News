import { AD_POSITIONS, AdPositionKey } from "@/lib/adPositions"
import { ApiService } from "@/services/apiService"
import AdUnit from "./AdUnit"
import { OptimizedImage } from "../ui/OptimizedImage"

interface AdManagerProps {
  position: AdPositionKey
  className?: string
  priority?: boolean
  maxAds?: number
  showLabel?: boolean
  fallbackComponent?: React.ReactNode
  imgClass?:string
  retryCount?:number
  bypassCache?:boolean
}

async function getSlot(position:AdPositionKey) {
  try {
    const res = await ApiService.fetchAdsByPosition(position)

    // console.log('adds by position',position,res)

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
  retryCount = 2,
  bypassCache = false
}: AdManagerProps) {
  // const slots = await getSlot(position)


  const slots = bypassCache 
    ? await ApiService.getSlotFresh(position)  // Create a fresh fetch function
    : await getSlot(position)

const slotsToShow = slots.slice(0, maxAds)
const positionConfig = AD_POSITIONS[position]





return(
<div className={`slot-position ${position} ${className}`}>
      {slotsToShow?.map((ad, index) => (
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