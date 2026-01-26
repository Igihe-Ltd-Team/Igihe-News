// 'use client'

// import { useEffect } from 'react'
// import { useQueryClient } from '@tanstack/react-query'
// import { NewsItem } from '@/types/fetchData'
// import { queryKeys } from '@/lib/queryKeys'

// interface HydrateArticleProps {
//   article: NewsItem | null
//   slug: string
//   children: React.ReactNode
// }

// export default function HydrateArticle({ article, slug, children }: HydrateArticleProps) {
//   const queryClient = useQueryClient()

//   useEffect(() => {
//     if (article) {
//       // Hydrate React Query cache with server data
//       queryClient.setQueryData(
//         queryKeys.articles.detail(slug),
//         article,
//         {
//           updatedAt: Date.now(), // Mark as fresh
//         }
//       )

//       console.log('🎯 Hydrated React Query cache:', slug)
//     }
//   }, [article, slug, queryClient])

//   return <>{children}</>
// }






















// 'use client'

// import { useEffect } from 'react'
// import { useQueryClient } from '@tanstack/react-query'
// import { NewsItem } from '@/types/fetchData'
// import { queryKeys } from '@/lib/queryKeys'

// interface HydrateArticleProps {
//   article: NewsItem | null
//   slug: string
//   children: React.ReactNode
// }

// export default function HydrateArticle({ article, slug, children }: HydrateArticleProps) {
//   const queryClient = useQueryClient()

//   useEffect(() => {
//     // Only hydrate if we have valid data AND it's not already in cache
//     if (article?.id) {
//       const existingCache = queryClient.getQueryData(queryKeys.articles.detail(slug))
      
//       // Only hydrate if cache is empty or if server data is newer
//       if (!existingCache || article.date > (existingCache as NewsItem)?.date) {
//         queryClient.setQueryData(
//           queryKeys.articles.detail(slug),
//           article,
//           {
//             updatedAt: Date.now(),
//           }
//         )
//         console.log('🎯 Hydrated React Query cache:', slug)
//       } else {
//         console.log('⚠️ Using existing cache for:', slug)
//       }
//     }
//   }, [article, slug, queryClient])

//   // Render immediately - don't wait for hydration
//   return <>{children}</>
// }






'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NewsItem } from '@/types/fetchData'
import { queryKeys } from '@/lib/queryKeys'

interface HydrateArticleProps {
  article: NewsItem | null
  slug: string
  children: React.ReactNode
}

export default function HydrateArticle({ article, slug, children }: HydrateArticleProps) {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Only hydrate if we have valid article data
    if (article?.id) {
      // Set query data without complex comparisons
      // Server data is always the source of truth on initial load
      queryClient.setQueryData(
        queryKeys.articles.detail(slug),
        article
      )
    }
  }, [article, slug, queryClient])

  // Render immediately - don't wait for hydration
  return <>{children}</>
}