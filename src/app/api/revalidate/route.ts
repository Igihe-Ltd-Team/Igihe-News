// app/api/revalidate/route.ts

export const runtime = 'nodejs' // required — fileCache uses fs, not available on Edge

import { clearCache } from '@/services/cacheManager'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const SECRET = process.env.REVALIDATION_SECRET

async function purgeAll(slug?: string, category?: string) {
  // ── 1. Clear custom memory + file cache ────────────────────────────────────
  //
  // Every cache key prefix used across all service files:
  //   articleService  → post:, articles:, opinion:, advertorial:, announcement:, fact-of-the-day:, search:
  //   trafficService  → popular:
  //   categoryService → categories:
  //   mediaService    → videos:, author-posts:
  //
  // We intentionally skip:
  //   slots:      (ads — 1hr TTL, safe to leave)
  //   media:      (images — 1hr TTL, never changes on publish)
  //   comments:   (per-post, unrelated to new article)
  //   video:      (single video, unrelated)

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
  ].filter(Boolean) as string[]

  await Promise.all(patterns.map(p => clearCache(p)))

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