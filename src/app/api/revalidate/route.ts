export const runtime = 'nodejs'

import { prefetchHomeData } from '@/lib/prefetch-home-data'
import { resetRegistry } from '@/lib/postRegistry'
import {
  buildRevalidationPlan,
  normalizeRevalidateSearchParams,
  WordPressChange,
} from '@/lib/wordpressRevalidation'
import { ApiService } from '@/services/apiService'
import { clearCache } from '@/services/cacheManager'
import { proxyCache } from '@/lib/proxyCache'
import { requestSitemapRegeneration } from '@/lib/sitemap/scheduler'
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const SECRET = process.env.REVALIDATION_SECRET
const ASK_IGIHE_WEBHOOK_URL = process.env.ASK_IGIHE_WEBHOOK_URL   // e.g. http://localhost:8000/api/v1/sources/wp-webhook
const ASK_IGIHE_WEBHOOK_SECRET = process.env.ASK_IGIHE_WEBHOOK_SECRET || ''

async function notifyAskIgihe(change: WordPressChange): Promise<void> {
  if (!ASK_IGIHE_WEBHOOK_URL || !change.slug) return
  const plan = buildRevalidationPlan(change)
  if (plan.type !== 'post' && plan.type !== 'opinion' && plan.type !== 'advertorial' && plan.type !== 'announcement') return
  try {
    await fetch(ASK_IGIHE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ASK_IGIHE_WEBHOOK_SECRET ? { 'X-WP-Secret': ASK_IGIHE_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify({
        slug: change.slug,
        language: change.language || 'rw',
        link: change.slug,
      }),
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    // Non-fatal — revalidation still succeeds even if ask-igihe ingestion fails
  }
}

function getSearchParams(request: NextRequest): URLSearchParams {
  return normalizeRevalidateSearchParams(request.nextUrl.searchParams)
}

function isAuthorized(request: NextRequest): boolean {
  const headerSecret = request.headers.get('x-revalidate-secret')
  const querySecret = getSearchParams(request).get('secret')
  return Boolean(SECRET && (headerSecret === SECRET || querySecret === SECRET))
}

async function warmFreshData(change: WordPressChange, warmTargets: string[]) {
  const tasks: Array<{ name: string; run: () => Promise<unknown> }> = []

  if (warmTargets.includes('article') && change.slug) {
    tasks.push({ name: 'article', run: () => ApiService.refreshArticle(change.slug!, true) })
  }
  if (warmTargets.includes('categories')) {
    tasks.push({ name: 'categories', run: () => ApiService.fetchCategories({ per_page: 100 }) })
  }
  if (warmTargets.includes('ads')) {
    tasks.push({ name: 'ads', run: () => ApiService.fetchAdvertisements() })
  }
  if (warmTargets.includes('videos')) {
    tasks.push({ name: 'videos', run: () => ApiService.fetchVideos({ per_page: 21 }) })
  }
  if (warmTargets.includes('home')) {
    tasks.push({ name: 'home', run: () => prefetchHomeData() })
  }

  const results = await Promise.allSettled(tasks.map(task => task.run()))
  return tasks.map((task, index) => ({
    target: task.name,
    status: results[index].status,
  }))
}

async function applyWordPressChange(change: WordPressChange) {
  const plan = buildRevalidationPlan(change)

  resetRegistry()
  if (plan.type === 'ads' || plan.type === 'unknown') {
    ApiService.clearAdsCache()
  }
  if (plan.proxyPatterns === 'all') {
    proxyCache.clear()
  } else {
    plan.proxyPatterns.forEach(pattern => proxyCache.clearByPattern(pattern))
  }

  await Promise.all(plan.cachePatterns.map(pattern => clearCache(pattern)))

  const warmed = await warmFreshData(change, plan.warm)

  if (plan.type === 'ads' || plan.type === 'unknown') {
    revalidateTag('advertisements', 'max')
    revalidateTag('slots', 'max')
  }
  plan.paths.forEach(item => revalidatePath(item.path, item.type))

  // Sitemap files are rebuilt in the background (debounced) so lastmod keeps
  // tracking real publish/update times; this never delays the webhook.
  if (plan.sitemaps.regenerate) {
    requestSitemapRegeneration(`webhook:${plan.type}${change.slug ? `:${change.slug}` : ''}`, {
      removals: plan.sitemaps.removals,
    })
  }

  return { plan, warmed }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let change: WordPressChange = {}
  try {
    change = await request.json()
  } catch {
    // An empty payload intentionally performs a broad refresh.
  }

  try {
    const [result] = await Promise.all([
      applyWordPressChange(change),
      notifyAskIgihe(change),
    ])
    return NextResponse.json({
      revalidated: true,
      change: { ...change, type: result.plan.type },
      cachePatterns: result.plan.cachePatterns,
      proxyPatterns: result.plan.proxyPatterns,
      paths: result.plan.paths.map(item => item.path),
      sitemaps: result.plan.sitemaps,
      warmed: result.warmed,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = getSearchParams(request)
  const categories = params.getAll('categories')
  const id = params.get('id')
  const change: WordPressChange = {
    slug: params.get('slug') ?? undefined,
    id: id ? Number(id) : undefined,
    type: params.get('type') ?? undefined,
    category: params.get('category') ?? undefined,
    categories: categories.length ? categories : undefined,
    action: params.get('action') ?? undefined,
    status: params.get('status') ?? undefined,
  }

  try {
    const [result] = await Promise.all([
      applyWordPressChange(change),
      notifyAskIgihe(change),
    ])
    return NextResponse.json({
      revalidated: true,
      change: { ...change, type: result.plan.type },
      cachePatterns: result.plan.cachePatterns,
      proxyPatterns: result.plan.proxyPatterns,
      paths: result.plan.paths.map(item => item.path),
      sitemaps: result.plan.sitemaps,
      warmed: result.warmed,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
