'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

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
  placeholderType?: 'blur' | 'solid' | 'skeleton'
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
  imgClass,
    placeholderType = 'solid',
  fill = false,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Small delay to prevent flash of loading state for fast-loading images
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])
  

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  // Fallback image
  // console.log('Image Error',hasError)
  // console.log('Image src Error',src)

  const imageSrc = hasError ? '/assets/igiheIcon.png' : src
const containerHeight = Math.max(Number(height), 100) + 'px'



if (!isMounted) {
    return (
      <div
          className={`placeholder-glow ${placeholderType === 'skeleton' ? 'placeholder' : ''}`}
          style={{
            // position: 'absolute',
            inset: 0,
            height:height,
            backgroundColor: placeholderType === 'solid' ? '#e9ecef' : 'transparent',
            borderRadius: '8px',
            zIndex: 1,
          }}
        />
    )
  }



  return (
    <div className={`position-relative w-100 igihe-img ${className}`} 
    style={{
      // minHeight:height,
      // maxHeight:'100%',
      // height: containerHeight

        minHeight: height ? `${height}px` : 'auto',
        height: height ? `${height}px` : 'auto',
        overflow: 'hidden',
    }}>


      {isVisible && isLoading && (
        <div
          className={`placeholder-glow ${placeholderType === 'skeleton' ? 'placeholder' : ''}`}
          style={{
            // position: 'absolute',
            inset: 0,
            height:height,
            backgroundColor: placeholderType === 'solid' ? '#e9ecef' : 'transparent',
            borderRadius: '8px',
            zIndex: 1,
          }}
        />
      )}


      <Image
        src={imageSrc}
        alt={alt}
        fill
        priority={priority}
        className={`${imageSrc === '/assets/igiheIcon.png' ? 'blur object-fit-contain p-3' : imgClass}`}
        onLoad={handleLoad}
        loading={priority ? "eager" : "lazy"}
        onError={handleError}
        placeholder="blur"
        blurDataURL="/assets/igiheIcon.png"
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />

    </div>
  )
}