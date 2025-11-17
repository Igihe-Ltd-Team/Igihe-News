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
  const adImage = ad.acf?.ads_image_source?.formatted_value

  

  // Get the best image size based on position
  const getBestImageUrl = () => {
    if (!adImage.sizes) return adImage.url
    
    const { dimensions } = positionConfig
    
    if (dimensions.width <= 300 && adImage.sizes.medium) {
      return adImage.sizes.medium
    } else if (dimensions.width <= 768 && adImage.sizes.large) {
      return adImage.sizes.large
    } else if (adImage.sizes['1536x1536']) {
      return adImage.sizes['1536x1536']
    }


    if(adImage.url)
    {
        setIsVisible(false)
        setImageError(false)
    }
    
    return adImage.url
  }

  const imageUrl = getBestImageUrl()


  if (!isVisible || !adImage || imageError) {
    return (
      <div 
        className={`ad-placeholder ${className}`} 
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
    <div className={`ad-unit ad-${position} ${className}`}>
      <a 
        href={ad.acf.igh_ad_url || ad.link} 
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
          className="img-fluid rounded"
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