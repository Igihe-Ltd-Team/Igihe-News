'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  className?: string
  sizes?: string
  onLoad?: () => void,
  imgClass?:string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  imgClass
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  // Fallback image
  const imageSrc = hasError ? '/assets/igiheIcon.png' : src

  return (
    <div className={`position-relative w-100 igihe-img ${className}`} 
    style={{
      minHeight:height,
      maxHeight:'100%',
      height: Math.max(Number(height), 100) + 'px'
    }}>

      {
        isLoading 
        ? 
        <div
                className="placeholder-glow"
                style={{
                  height:  Math.max(Number(height), 100) + 'px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '8px',
                }}
              />
      :
        <Image
        src={imageSrc}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={`${isLoading ? 'blur object-fit-contain':''} ${imageSrc === '/assets/igiheIcon.png' ? 'blur object-fit-contain':imgClass}`}
        onLoad={handleLoad}
        loading={priority ? "eager" : "lazy"}
        onError={handleError}
        placeholder="blur"
        // blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R"
        blurDataURL="/assets/igiheIcon.png"
      />
      }
      
    </div>
  )
}