// 'use client'

// import { useEffect } from 'react'

// interface CommentsSectionProps {
//   articleId: number
//   articleTitle: string
// }

// export default function CommentsSection({ articleId, articleTitle }: CommentsSectionProps) {
//   useEffect(() => {
//     // Dynamically load Commentics script
//     const script = document.createElement('script')
//     script.src = 'https://cmtscript.igihe.com/embed.js'
//     script.async = true
//     document.body.appendChild(script);

//     // Set configuration
//     (window as any).commentics_config = {
//       identifier: `en-article-${articleId}`,
//       reference: articleTitle
//     }

//     return () => {
//       // Clean up script when component unmounts
//       if (document.body.contains(script)) {
//         document.body.removeChild(script)
//       }
//     }
//   }, [articleId, articleTitle])

//   return <div id="commentics" className="mt-8 border-t pt-8" />
// }



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

  return <div id="commentics" className="mt-8 border-t pt-8" style={{display:'none'}}/>
}