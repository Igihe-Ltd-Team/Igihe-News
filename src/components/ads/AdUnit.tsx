'use client'


import { AD_POSITIONS, AdPositionKey } from '@/lib/adPositions'
import { Advertisement } from '@/types/fetchData'
import { useState } from 'react'
import { OptimizedImage } from '../ui/OptimizedImage'

interface AdUnitProps {
  ad: Advertisement
  position: AdPositionKey
  className?: string
  priority?: boolean
  showLabel?: boolean
  imgClass?:string
}

export default function AdUnit({ 
  ad, 
  position, 
  className = '', 
  priority = false,
  showLabel = true,
  imgClass
}: AdUnitProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [imageError, setImageError] = useState(false)

  const positionConfig = AD_POSITIONS[position]
  const adImage = ad
  const { dimensions } = positionConfig

  
 
  // Get the best image size based on position
  // const getBestImageUrl = () => {
  //   // if (!adImage?.sizes) return adImage?.url
    
    
  //   console.log('this position dimensions',dimensions)
    
  //   if (dimensions.width <= 300 && adImage?.sizes.medium) {
  //     return adImage?.sizes?.medium
  //   } else if (dimensions.width <= 768 && adImage?.sizes.large) {
  //     return adImage?.sizes.large
  //   } else if (adImage?.sizes['1536x1536']) {
  //     return adImage?.sizes['1536x1536']
  //   }


  //   if(adImage.ads_image.url)
  //   {
  //       setIsVisible(true)
  //       setImageError(false)
  //   }
    
  //   return adImage.ads_image.url
  // }

  // const imageUrl = getBestImageUrl()


  console.log('this position dimensions',ad.ads_image.url)


  const rawUrl = ad.ads_image.url
  const imageUrl = rawUrl ? `${rawUrl}?v=${dimensions.height || ad.id}` : rawUrl


  console.log('this position rows',imageUrl)

  if (!adImage.ads_image.url || imageError) {
    return (
      <div 
        className={`slot-placeholder ${className}`} 
        style={{ 
          width: positionConfig.dimensions.width,
          height: positionConfig.dimensions.height 
        }}
      >
        <span className="text-muted">Advertisement</span>
      </div>
    )
  }


  return (
    <div className={`slot-unit tag-${position} ${className}`}>
      <a 
        href={ad?.acf?.igh_ad_url || ad?.link} 
        target="_blank" 
        rel="noopener noreferrer nofollow sponsored"
        className="d-block text-decoration-none"
        onClick={(e) => {
          // Track ad clicks if needed
        //   console.log('Ad clicked:', ad.title.rendered, ad.acf.igh_ad_url)
        }}
      >
        <OptimizedImage
          src={imageUrl}
          alt={ad.title.rendered}
          width={positionConfig.dimensions.width}
          height={positionConfig.dimensions.height}
          className="img-fluid"
          priority={priority}
          imgClass={`object-fit-contain ${imgClass}`}
        />
      </a>
      {/* {showLabel && (
        <small className="text-muted d-block text-center mt-1">
          Advertisement
        </small>
      )} */}
    </div>
  )
}