import { NextResponse } from 'next/server'
import { fileCache } from '@/lib/cache/fileCache'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function checkWordPress(): Promise<boolean> {
  const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL
  if (!apiUrl) return false

  try {
    const response = await fetch(`${apiUrl}/posts?per_page=1&_fields=id`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
    })
    return response.ok
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const readinessRequested = url.searchParams.get('readiness') === '1'
  const deepCheckRequested = url.searchParams.get('deep') === '1'
  const healthSecret = process.env.HEALTH_CHECK_SECRET

  if (
    deepCheckRequested &&
    (!healthSecret || request.headers.get('x-health-secret') !== healthSecret)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!readinessRequested && !deepCheckRequested) {
    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const checks = {
    wordpressApiConfigured: Boolean(process.env.NEXT_PUBLIC_WORDPRESS_API_URL),
    appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    fileCacheWritable: await fileCache.healthCheck(),
    ...(deepCheckRequested ? { wordpressReachable: await checkWordPress() } : {}),
  }
  const healthy = Object.values(checks).every(Boolean)
  const cache = await fileCache.getStats()

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checks,
      cache: {
        backend: 'memory-and-filesystem',
        entries: cache.count,
        sizeBytes: cache.size,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
