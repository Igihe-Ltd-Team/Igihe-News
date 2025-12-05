'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface UseMetadataOptions {
  title?: string
  description?: string
  image?: string
  author?: string
  publishedTime?: string
  keywords?: string[]
  canonicalUrl?: string
  noindex?: boolean
}

export function useMetadata({
  title,
  description,
  image,
  author,
  publishedTime,
  keywords,
  canonicalUrl,
  noindex = false
}: UseMetadataOptions) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!title) return

    console.log('Updating metadata via hook...')

    // Update document title
    document.title = `${title}${title.includes('| IGIHE') ? '' : ' | IGIHE'}`

    // Update meta tags
    updateMetaTag('description', description)
    updateMetaTag('og:title', title)
    updateMetaTag('og:description', description)
    updateMetaTag('og:image', image)
    updateMetaTag('og:url', canonicalUrl || window.location.href)
    updateMetaTag('twitter:title', title)
    updateMetaTag('twitter:description', description)
    updateMetaTag('twitter:image', image)

    // Author and published time
    if (author) {
      updateMetaTag('article:author', author)
      updateMetaTag('og:article:author', author)
    }

    if (publishedTime) {
      updateMetaTag('article:published_time', publishedTime)
      updateMetaTag('og:article:published_time', publishedTime)
    }

    // Keywords
    if (keywords && keywords.length > 0) {
      updateMetaTag('keywords', keywords.join(', '))
    }

    // Robots meta
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow')
    } else {
      updateMetaTag('robots', 'index, follow')
    }

    // Canonical URL
    if (canonicalUrl) {
      updateMetaTag('canonical', canonicalUrl, 'link', 'href')
    }

    // Update structured data
    updateStructuredData({
      title,
      description,
      image,
      author,
      publishedTime,
      url: canonicalUrl || window.location.href
    })

    // Update JSON-LD for rich snippets
    updateJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description,
      image: image,
      datePublished: publishedTime,
      author: {
        '@type': 'Person',
        name: author || 'IGIHE Editorial Team'
      },
      publisher: {
        '@type': 'Organization',
        name: 'IGIHE',
        logo: {
          '@type': 'ImageObject',
          url: 'https://stage.igihe.com/logo.png'
        }
      }
    })

  }, [
    title,
    description,
    image,
    author,
    publishedTime,
    keywords,
    canonicalUrl,
    noindex,
    pathname,
    searchParams
  ])
}

function updateMetaTag(
  name: string,
  content?: string,
  tagName: string = 'meta',
  contentAttr: string = 'content'
) {
  if (!content) return

  let element: HTMLElement | null = null

  // Different selectors for different meta types
  if (name === 'canonical') {
    element = document.querySelector(`link[rel="${name}"]`) as HTMLLinkElement
  } else if (name.startsWith('og:') || name.startsWith('twitter:')) {
    element = document.querySelector(`meta[property="${name}"]`) as HTMLMetaElement
  } else {
    element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
  }

  if (element) {
    element.setAttribute(contentAttr, content)
  } else {
    // Create new element
    const newElement = document.createElement(tagName)
    
    if (name === 'canonical') {
      newElement.setAttribute('rel', 'canonical')
      newElement.setAttribute(contentAttr, content)
    } else if (name.startsWith('og:') || name.startsWith('twitter:')) {
      newElement.setAttribute('property', name)
      newElement.setAttribute(contentAttr, content)
    } else {
      newElement.setAttribute('name', name)
      newElement.setAttribute(contentAttr, content)
    }
    
    document.head.appendChild(newElement)
  }
}

function updateStructuredData(data: any) {
  // Remove existing structured data script
  const existing = document.getElementById('structured-data')
  if (existing) existing.remove()

  const script = document.createElement('script')
  script.id = 'structured-data'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}

function updateJsonLd(data: any) {
  // Remove existing JSON-LD
  const existing = document.getElementById('json-ld')
  if (existing) existing.remove()

  const script = document.createElement('script')
  script.id = 'json-ld'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(data)
  document.head.appendChild(script)
}