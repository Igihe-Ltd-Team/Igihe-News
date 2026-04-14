// app/api/revalidate/route.ts

export const runtime = 'nodejs' // required — fileCache uses fs, not available on Edge

import { ApiService } from '@/services/apiService'
import { clearCache } from '@/services/cacheManager'
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const SECRET = process.env.REVALIDATION_SECRET


async function getAllCategories(): Promise<string[]> {
  const categories = await ApiService.fetchCategories()
  // Adjust `.slug` to match your category object shape
  return categories.map((c: { slug: string }) => c.slug).filter(Boolean)
}

async function purgeAll(slug?: string, category?: string) {

  const patterns = [
    slug ? `post:${slug}` : null,  // specific article first (fast path)
    'articles:',      // all paginated article lists
    'popular:',       // traffic-based popular lists
    'opinion:',       // opinion lists
    'advertorial:',   // advertorial lists
    'announcement:',  // announcement lists
    'categories:',    // category lists + counts (new article changes count)
    'search:',        // search results now stale
    'author-posts:',  // author article lists now stale
    'slots:',
  ].filter(Boolean) as string[]

  await Promise.all(patterns.map(p => clearCache(p)))


  try {
    const adModule = await import('@/services/apiService')
    // Reset the module-level cache variables
    if ('adsCache' in adModule) {
      // @ts-ignore - accessing module internals
      adModule.adsCache = null
      // @ts-ignore
      adModule.adsCacheTimestamp = 0
    }
  } catch (e) {
    console.warn('Could not clear ad module cache:', e)
  }
  
  revalidateTag('advertisements','page')
  revalidateTag('slots', 'page')

  
  // ── 2. Revalidate Next.js page cache ──────────────────────────────────────
  //
  // Pattern revalidation — marks ALL instances of each dynamic route stale.
  // Route groups (categories) and (tags) are transparent to the URL.
  revalidatePath('/[category]/article/[post]', 'page')  // (categories)/[category]/article/[post]
  revalidatePath('/[category]', 'page')                  // (categories)/[category]
  revalidatePath('/tag/[tag]', 'page')                   // (tags)/tag/[tag]
  revalidatePath('/opinion', 'page')
  revalidatePath('/announcements', 'page')
  revalidatePath('/advertorials', 'page')
  revalidatePath('/', 'layout')                          // homepage + all shared layout

  // Exact-path revalidation — queues an immediate background rebuild of the
  // specific article page so the very first visitor after the webhook gets
  // fresh content without needing a second request.
  if (slug && category) {
    revalidatePath(`/${category}/article/${slug}`)
    revalidatePath(`/${category}`)
  }
  else{
    const allSlugs = await getAllCategories()
    allSlugs.forEach(cat => revalidatePath(`/${cat}`))
  }
}

export async function POST(request: NextRequest) {
  // ── Authenticate ──────────────────────────────────────────────────────────
  const incomingSecret =
    request.headers.get('x-revalidate-secret') ||
    request.nextUrl.searchParams.get('secret')

  if (!SECRET || incomingSecret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  // WordPress sends:
  //   { slug: "article-slug", id: 123, type: "post", category: "sport" }
  let body: { slug?: string; id?: number; type?: string; category?: string } = {}
  try {
    body = await request.json()
  } catch {
    // Empty body → broad purge, that's fine
  }

  const { slug, id, type = 'post', category } = body
  console.log(`🔄 Revalidate — slug:${slug} id:${id} type:${type} category:${category}`)

  try {
    await purgeAll(slug, category)
    return NextResponse.json({ revalidated: true, slug, id, type, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json({ error: 'Revalidation failed', detail: String(error) }, { status: 500 })
  }
}

// GET — manual testing:
// curl "https://your-site.com/api/revalidate?secret=SECRET&slug=my-slug&category=sport"
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  if (!SECRET || secret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slug     = request.nextUrl.searchParams.get('slug')     ?? undefined
  const category = request.nextUrl.searchParams.get('category') ?? undefined

  await purgeAll(slug, category)
  return NextResponse.json({ revalidated: true, slug, category, timestamp: new Date().toISOString() })
}