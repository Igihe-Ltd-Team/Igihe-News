'use client'

import { useEffect } from 'react'

interface CommentsSectionProps {
  articleId: number
  articleTitle: string
}

export default function CommentsSection({ articleId, articleTitle }: CommentsSectionProps) {
  useEffect(() => {
    // Dynamically load Commentics script
    const script = document.createElement('script')
    script.src = 'https://en.igihe.com/comments/embed.js'
    script.async = true
    document.body.appendChild(script)

    // Set configuration
    ;(window as any).commentics_config = {
      identifier: `en-article-${articleId}`,
      reference: articleTitle
    }

    return () => {
      // Clean up script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [articleId, articleTitle])

  return <div id="commentics" className="mt-8 border-t pt-8" />
}