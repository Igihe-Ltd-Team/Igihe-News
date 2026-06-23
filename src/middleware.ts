import { fetchPostByIdLookUp, fetchPostBySlugLookUp } from '@/services/apiService'
import { NextRequest, NextResponse } from 'next/server'

const TYPE_MAPPING: Record<string, string> = {
  post: 'news',
  opinion: 'opinion',
  advertorial: 'advertorial',
  announcement: 'announcement',
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (pathname === '/spip.php') {
    const rawUrl = req.url
    const queryString = rawUrl.split('?')[1] ?? ''
    const params = new URLSearchParams(queryString)


    const id = params.get('id_article')

    
    if (id) {
      const article = await fetchPostByIdLookUp(id)
      

      if (article) {
        const typeSegment = TYPE_MAPPING[article.type] || article.type
        return NextResponse.redirect(
          new URL(`/${typeSegment}/article/${article.slug}`, req.url),
          301
        )
      }
    }

    return NextResponse.next()
  }




  const slug = pathname.replace(/^\//, '').replace(/\.html$/, '')

  const article = await fetchPostBySlugLookUp(slug)

  if (article) {
    const typeSegment = TYPE_MAPPING[article.type] || article.type
    return NextResponse.redirect(
      new URL(`/${typeSegment}/article/${article.slug}`, req.url),
      301
    )
  }

  return NextResponse.next()
}

// Only run on legacy .html URLs — keeps all normal page requests free of middleware overhead
export const config = {
  matcher: ['/(.*\\.html)','/spip.php'],
  
}