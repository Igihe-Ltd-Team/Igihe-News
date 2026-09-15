import { fetchPostByIdLookUp, fetchPostBySlugLookUp } from '@/services/apiService'
import { resolveAuthorSlug } from '@/lib/sitemap/authors'
import { NextRequest, NextResponse } from 'next/server'

const TYPE_MAPPING: Record<string, string> = {
  post: 'news',
  opinion: 'opinion',
  advertorial: 'advertorial',
  announcement: 'announcement',
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Duplicate byline spellings (src/data/authorAliases.ts) get a real 301
  // here, before the page starts streaming — a redirect thrown inside the
  // page would arrive as a 200 with a client-side redirect.
  if (pathname.startsWith('/author/')) {
    const slug = decodeURIComponent(pathname.slice('/author/'.length).replace(/\/+$/, ''))
    const canonical = resolveAuthorSlug(slug)
    if (slug && canonical !== slug) {
      return NextResponse.redirect(new URL(`/author/${canonical}`, req.url), 301)
    }
    return NextResponse.next()
  }

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

// Only run on legacy .html URLs and author archives — keeps all other page
// requests free of proxy overhead
export const config = {
  matcher: ['/(.*\\.html)', '/spip.php', '/author/:slug+'],
}