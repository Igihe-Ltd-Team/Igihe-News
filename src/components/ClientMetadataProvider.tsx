'use client'

import { useEffect } from 'react'
import { useMetadata } from '@/hooks/useMetadata'

interface ClientMetadataProviderProps {
  children: React.ReactNode
  metadata: {
    title?: string
    description?: string
    image?: string
    author?: string
    publishedTime?: string
    keywords?: string[]
    canonicalUrl?: string
  }
}

export default function ClientMetadataProvider({
  children,
  metadata
}: ClientMetadataProviderProps) {
  // Use the metadata hook
  useMetadata(metadata)

  // Also update additional meta tags
  useEffect(() => {
    // Update other meta tags as needed
    if (metadata.title) {
      // Update additional social meta tags
      updateMetaTag('og:type', 'article')
      updateMetaTag('og:site_name', 'IGIHE')
      updateMetaTag('twitter:card', 'summary_large_image')
      updateMetaTag('twitter:site', '@igihe')
      
      if (metadata.author) {
        updateMetaTag('twitter:creator', `@${metadata.author.replace(/\s+/g, '')}`)
      }
    }
  }, [metadata])

  return <>{children}</>
}

function updateMetaTag(name: string, content?: string) {
  if (!content) return
  // ... same as before
}