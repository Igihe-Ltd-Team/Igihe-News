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


  const rawUrl = ad.ads_image.url.includes('en-images.igihe.com/IMG/png/')
    ? ad.featured_image?.url || ad.ads_image.url
    : ad.ads_image.url
  const imageUrl = rawUrl ? `${rawUrl}?v=${dimensions.height || ad.id}` : rawUrl

const adDestination = ad?.meta?.igh_ad_url
  const destinationHref = adDestination || '#'
    
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
      href={destinationHref}
        target="_blank" 
        rel="noopener noreferrer nofollow sponsored"
        className="d-block text-decoration-none"
      >
        <OptimizedImage
          src={imageUrl}
          alt={ad.title.rendered}
          aspectRatio={positionConfig.dimensions.ratio}
          width={positionConfig.dimensions.width}
          // height={positionConfig.dimensions.height}
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
