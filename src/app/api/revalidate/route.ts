// import { revalidatePath } from 'next/cache'
// import { NextRequest, NextResponse } from 'next/server'

// export async function GET(request: NextRequest) {
//   const path = request.nextUrl.searchParams.get('path') || '/'
  
//   try {
//     revalidatePath(path)
//     return NextResponse.json({ 
//       revalidated: true, 
//       now: Date.now(),
//       path 
//     })
//   } catch (err) {
//     return NextResponse.json({ 
//       revalidated: false,
//       error: String(err) 
//     }, { status: 500 })
//   }
// }







// app/api/revalidate/route.ts
//
// WordPress calls this endpoint via a webhook plugin whenever a post is
// published, updated, or deleted. It then:
//   1. Validates the shared secret so only WP can trigger it
//   2. Clears the in-memory + file cache for the affected article
//   3. Tells Next.js to re-render any cached pages that show that article
//
// ── Setup ────────────────────────────────────────────────────────────────────
// 1. Add REVALIDATION_SECRET to your .env.local (any long random string)
// 2. Install the nextjs-revalidate.php plugin on WordPress
// ─────────────────────────────────────────────────────────────────────────────

import { clearCache } from '@/services/cacheManager'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const SECRET = process.env.REVALIDATION_SECRET

export async function POST(request: NextRequest) {
  // ── 1. Authenticate ───────────────────────────────────────────────────────
  const incomingSecret =
    request.headers.get('x-revalidate-secret') ||
    request.nextUrl.searchParams.get('secret')

  if (!SECRET || incomingSecret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: { slug?: string; id?: number; type?: string } = {}
  try {
    body = await request.json()
  } catch {
    // Empty body = broad purge, that's fine
  }

  const { slug, id, type = 'post' } = body

  console.log(`🔄 Revalidation triggered — slug: ${slug}, id: ${id}, type: ${type}`)

  try {
    // ── 3. Clear custom file/memory cache ────────────────────────────────
    if (slug) {
      await clearCache(`post:${slug}`)
    }

    // Bust all list caches so every listing page reflects the change
    await clearCache('articles:')
    await clearCache('popular:')
    await clearCache('opinion:')
    await clearCache('advertorial:')
    await clearCache('announcement:')

    // ── 4. Revalidate Next.js page cache ─────────────────────────────────
    //
    // Your route structure:
    //   (categories)/[category]/page.tsx              → /[category]
    //   (categories)/[category]/article/[post]/page.tsx → /[category]/article/[post]
    //   (tags)/tag/[tag]/page.tsx                     → /tag/[tag]
    //   opinion/page.tsx                              → /opinion
    //   announcements/page.tsx                        → /announcements
    //   advertorials/page.tsx                         → /advertorials
    //
    // Route groups like (categories) and (tags) are transparent to the URL,
    // so we omit them in revalidatePath. Using the dynamic segment pattern
    // (e.g. '/[category]') invalidates ALL pages under that segment at once.

    // Article page — covers every /[category]/article/[post] combination
    revalidatePath('/[category]/article/[post]', 'page')

    // Category listing pages — covers every /[category]
    revalidatePath('/[category]', 'page')

    // Tag pages — covers every /tag/[tag]
    revalidatePath('/tag/[tag]', 'page')

    // Static listing pages
    revalidatePath('/opinion', 'page')
    revalidatePath('/announcements', 'page')
    revalidatePath('/advertorials', 'page')

    // Homepage + shared layout (hero, sidebar, ticker, breaking news, etc.)
    revalidatePath('/', 'layout')

    return NextResponse.json({
      revalidated: true,
      slug,
      id,
      type,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { error: 'Revalidation failed', detail: String(error) },
      { status: 500 }
    )
  }
}

// GET — manual trigger for quick testing in the browser or with curl:
// curl "https://your-site.com/api/revalidate?secret=YOUR_SECRET&slug=my-article-slug"
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (!SECRET || secret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slug = request.nextUrl.searchParams.get('slug') ?? undefined

  if (slug) await clearCache(`post:${slug}`)
  await clearCache('articles:')
  await clearCache('opinion:')
  await clearCache('advertorial:')
  await clearCache('announcement:')

  revalidatePath('/[category]/article/[post]', 'page')
  revalidatePath('/[category]', 'page')
  revalidatePath('/tag/[tag]', 'page')
  revalidatePath('/opinion', 'page')
  revalidatePath('/announcements', 'page')
  revalidatePath('/advertorials', 'page')
  revalidatePath('/', 'layout')

  return NextResponse.json({ revalidated: true, slug, timestamp: new Date().toISOString() })
}