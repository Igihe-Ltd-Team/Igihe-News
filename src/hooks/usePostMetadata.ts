'use client'

import { useState, useEffect } from 'react'
import { useMetadata } from './useMetadata'

interface PostMetadata {
  title: string
  description: string
  image: string
  author: string
  publishedTime: string
  keywords: string[]
  canonicalUrl: string
}

export function usePostMetadata(slug: string, initialData?: Partial<PostMetadata>) {
  const [metadata, setMetadata] = useState<PostMetadata | null>(
    initialData ? {
      title: initialData.title || '',
      description: initialData.description || '',
      image: initialData.image || '',
      author: initialData.author || '',
      publishedTime: initialData.publishedTime || '',
      keywords: initialData.keywords || [],
      canonicalUrl: initialData.canonicalUrl || ``
    } : null
  )
  
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  // Use the metadata hook to update HTML
  useMetadata({
    title: metadata?.title,
    description: metadata?.description,
    image: metadata?.image,
    author: metadata?.author,
    publishedTime: metadata?.publishedTime,
    keywords: metadata?.keywords,
    canonicalUrl: metadata?.canonicalUrl
  })

  useEffect(() => {
    if (initialData) return // Skip if we have initial data

    const fetchMetadata = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/posts/${slug}/metadata`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.status}`)
        }
        
        const data = await response.json()
        setMetadata(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Failed to fetch post metadata:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMetadata()
  }, [slug, initialData])

  return { metadata, loading, error, setMetadata }
}