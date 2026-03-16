'use client'

import { useEffect } from 'react'

interface CommentsSectionProps {
  articleId: number
  articleTitle: string
}

export default function CommentsSection({ articleId, articleTitle }: CommentsSectionProps) {
  useEffect(() => {
    // Set config BEFORE loading the script so it's available when embed.js runs
    ;(window as any).commentics_config = {
      identifier: `en-article-${articleId}`,
      reference: articleTitle,
    }

    const script = document.createElement('script')
    script.src = 'https://cmtscript.igihe.com/embed.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Clean up script and config on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
      delete (window as any).commentics_config

      // Clean up any iframe/spinner Commentics injected
      const commenticsEl = document.getElementById('commentics')
      if (commenticsEl) {
        commenticsEl.innerHTML = ''
      }
    }
  }, [articleId, articleTitle])

  return <div id="commentics" className="mt-8 border-t pt-8" />
}