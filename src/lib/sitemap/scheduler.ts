// In-process regeneration scheduling for the single-instance PM2 deployment:
// publish webhooks are debounced into one run, an hourly tick catches anything
// the webhook missed, and a daily full sync re-reads every article.

import { SCHEDULE } from './config.ts'
import { consoleLogger, regenerateSitemaps, type RegenerationReport } from './generate.ts'
import { loadInventory } from './store.ts'
import type { ArticleRemoval } from './types.ts'

interface SchedulerState {
  started: boolean
  debounceTimer: ReturnType<typeof setTimeout> | null
  firstRequestAt: number | null
  pendingReasons: string[]
  pendingRemovals: ArticleRemoval[]
  running: Promise<RegenerationReport | null> | null
  rerun: boolean
  lastReport: RegenerationReport | null
  lastError: string | null
  intervals: Array<ReturnType<typeof setInterval>>
}

const globalKey = '__igiheSitemapScheduler' as const
const globalState = globalThis as typeof globalThis & { [globalKey]?: SchedulerState }

function state(): SchedulerState {
  if (!globalState[globalKey]) {
    globalState[globalKey] = {
      started: false,
      debounceTimer: null,
      firstRequestAt: null,
      pendingReasons: [],
      pendingRemovals: [],
      running: null,
      rerun: false,
      lastReport: null,
      lastError: null,
      intervals: [],
    }
  }
  return globalState[globalKey]!
}

export function isSchedulerEnabled(): boolean {
  const flag = (process.env.SITEMAP_SCHEDULER ?? '').toLowerCase()
  if (flag === 'off' || flag === 'false' || flag === '0') return false
  if (flag === 'on' || flag === 'true' || flag === '1') return true
  return process.env.NODE_ENV === 'production'
}

async function runNow(mode: 'full' | 'incremental', reason: string): Promise<RegenerationReport | null> {
  const s = state()
  if (s.running) {
    s.rerun = true
    return s.running
  }
  const removals = s.pendingRemovals.splice(0)
  s.running = regenerateSitemaps({ mode, reason, removals, log: consoleLogger })
    .then(report => {
      s.lastReport = report
      s.lastError = null
      return report
    })
    .catch(error => {
      s.lastError = error instanceof Error ? error.message : String(error)
      // Put removals back so they are applied on the next successful run.
      s.pendingRemovals.unshift(...removals)
      return null
    })
    .finally(() => {
      s.running = null
      if (s.rerun) {
        s.rerun = false
        void runNow('incremental', 'coalesced')
      }
    })
  return s.running
}

function flush(): void {
  const s = state()
  if (s.debounceTimer) clearTimeout(s.debounceTimer)
  s.debounceTimer = null
  s.firstRequestAt = null
  const reason = s.pendingReasons.splice(0).slice(0, 5).join(', ') || 'webhook'
  void runNow('incremental', reason)
}

/**
 * Asks for the sitemaps to be regenerated soon. Calls arriving within the
 * debounce window are coalesced; a burst can't be postponed past maxWaitMs.
 * Safe to call from request handlers — never throws, never blocks.
 */
export function requestSitemapRegeneration(reason: string, options: { removals?: ArticleRemoval[] } = {}): void {
  const s = state()
  s.pendingReasons.push(reason)
  if (options.removals?.length) s.pendingRemovals.push(...options.removals)

  const now = Date.now()
  if (s.firstRequestAt === null) s.firstRequestAt = now
  const waitedTooLong = now - s.firstRequestAt >= SCHEDULE.maxWaitMs

  if (s.debounceTimer) clearTimeout(s.debounceTimer)
  if (waitedTooLong) {
    flush()
    return
  }
  s.debounceTimer = setTimeout(flush, SCHEDULE.debounceMs)
  s.debounceTimer.unref?.()
}

async function tick(): Promise<void> {
  const inventory = await loadInventory().catch(() => null)
  const fullAge = inventory?.fullSyncAt ? Date.now() - Date.parse(inventory.fullSyncAt) : Infinity
  if (fullAge >= SCHEDULE.fullSyncEveryMs) {
    await runNow('full', inventory?.fullSyncAt ? 'daily full sync' : 'initial full sync')
  } else {
    await runNow('incremental', 'hourly')
  }
}

async function coldStart(): Promise<void> {
  const inventory = await loadInventory().catch(() => null)
  if (inventory?.fullSyncAt) {
    await runNow('incremental', 'startup')
    return
  }
  // Publish something useful within a minute, then backfill everything.
  await runNow('incremental', 'startup (recent content)')
  await runNow('full', 'initial full sync')
}

/** Starts the timers once per process. No-op unless the scheduler is enabled. */
export function startSitemapScheduler(): boolean {
  const s = state()
  if (s.started) return true
  if (!isSchedulerEnabled()) return false
  s.started = true

  const kickoff = setTimeout(() => void coldStart(), 5_000)
  kickoff.unref?.()

  const hourly = setInterval(() => void tick(), SCHEDULE.incrementalEveryMs)
  hourly.unref?.()
  s.intervals.push(hourly)
  return true
}

export function stopSitemapScheduler(): void {
  const s = state()
  s.intervals.forEach(clearInterval)
  s.intervals = []
  if (s.debounceTimer) clearTimeout(s.debounceTimer)
  s.debounceTimer = null
  s.started = false
}

export function getSitemapSchedulerStatus() {
  const s = state()
  return {
    enabled: isSchedulerEnabled(),
    started: s.started,
    running: Boolean(s.running),
    pendingReasons: [...s.pendingReasons],
    pendingRemovals: s.pendingRemovals.length,
    lastRun: s.lastReport?.run ?? null,
    lastError: s.lastError,
  }
}

/** Test/CLI hook: runs a regeneration immediately, honouring the single-run lock. */
export function runSitemapRegenerationNow(mode: 'full' | 'incremental', reason: string): Promise<RegenerationReport | null> {
  return runNow(mode, reason)
}
