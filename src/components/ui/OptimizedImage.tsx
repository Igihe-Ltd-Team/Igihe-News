'use client'

import Image, { StaticImageData } from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string | StaticImageData | { url?: string; src?: string }
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  className?: string
  sizes?: string
  onLoad?: () => void,
  imgClass?:string
  placeholderType?: 'blur' | 'solid' | 'skeleton',
  aspectRatio?:string
}

export function OptimizedImage({
  src,
  alt,
  height,
  priority = false,
  className,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  imgClass,
    placeholderType = 'solid',
  aspectRatio = 'unset'
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
  // console.log('Image Error',hasError)
  // console.log('Image src Error',src)

  const sourceValue = typeof src === 'string'
    ? src
    : src && 'url' in src && typeof src.url === 'string'
      ? src.url
      : src && 'src' in src && typeof src.src === 'string'
        ? src.src
        : ''
  const safeSource = sourceValue.trim() || '/assets/igiheIcon.png'
  const imageSrc = hasError ? '/assets/igiheIcon.png' : safeSource
  const normalizedHeight = Number(height) > 0 ? Number(height) : undefined
  const minimumHeight = `${Math.max(normalizedHeight ?? 0, 100)}px`
  const isAnimatedGif = /\.gif(?:$|[?#])/i.test(imageSrc)
  const isLegacyImageHost = imageSrc.startsWith('https://en-images.igihe.com/') || imageSrc.startsWith('https://cdn.igihe.com/')
  const hasAspectRatio = aspectRatio !== 'unset'



  return (
    <div className={`position-relative w-100 igihe-img ${className}`} 
    style={{
      // minHeight:height,
      // maxHeight:'100%',
      // height: containerHeight

        minHeight: minimumHeight,
        height: normalizedHeight ? `${normalizedHeight}px` : hasAspectRatio ? 'auto' : minimumHeight,
        overflow: 'hidden',
        aspectRatio: aspectRatio,
    }}>


      {isLoading && (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundColor: placeholderType === 'solid' ? '#e9ecef' : 'transparent',
      borderRadius: '8px',
      zIndex: 1,
      // Optional: fade the placeholder out too
      transition: 'opacity 0.3s ease-in-out',
    }}
  />
)}


      {isAnimatedGif || isLegacyImageHost ? (
        // Next's optimizer cannot optimize animated/legacy images and emits
        // misleading fill/sizes warnings for them, so serve them directly.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={alt}
          className={imgClass}
          onLoad={handleLoad}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={handleError}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      ) : (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes={sizes}
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
      )}

    </div>
  )
}
