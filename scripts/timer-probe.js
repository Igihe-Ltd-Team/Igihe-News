// Diagnostic only. Run the server with:  NODE_OPTIONS="--require /full/path/to/timer-probe.js"
// Every 30 s it prints (to stderr) which lines of code created the timers that are STILL waiting, most first.
// It slows the server down a little; remove the NODE_OPTIONS once the answer is in.
const live = new Map() // stack key -> number of timers still pending
const owner = new WeakMap() // timer -> stack key
const realSetTimeout = global.setTimeout
const realClearTimeout = global.clearTimeout

function keyFromStack() {
  const old = Error.stackTraceLimit
  Error.stackTraceLimit = 14
  const frames = (new Error().stack || '').split('\n').slice(2)
  Error.stackTraceLimit = old
  const own = frames.filter(f => !f.includes('timer-probe.js'))
  const app = own.filter(f => !f.includes('node:') && !f.includes('node_modules/next/dist/compiled') )
  const pick = (app.length ? app : own).slice(0, 3).map(f => f.trim().replace(/^at /, '').replace(/\/home\/[^/]+\/public_html\/[^/]+\//, ''))
  return pick.join('  <-  ') || 'unknown'
}

function done(timer) {
  const key = owner.get(timer)
  if (key === undefined) return
  owner.delete(timer)
  live.set(key, (live.get(key) || 1) - 1)
}

global.setTimeout = function (callback, ms, ...args) {
  if (typeof callback !== 'function') return realSetTimeout.call(this, callback, ms, ...args)
  const key = keyFromStack()
  live.set(key, (live.get(key) || 0) + 1)
  const timer = realSetTimeout.call(this, function (...a) { done(timer); return callback.apply(this, a) }, ms, ...args)
  owner.set(timer, key)
  return timer
}
global.clearTimeout = function (timer) {
  if (timer && typeof timer === 'object') done(timer)
  return realClearTimeout.call(this, timer)
}

realSetTimeout(function report() {
  const rows = [...live.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const total = [...live.values()].reduce((a, b) => a + Math.max(0, b), 0)
  console.error(`[timer-probe] pending=${total}\n` + rows.map(([k, n]) => `   ${n}  ${k}`).join('\n'))
  realSetTimeout(report, 30000).unref()
}, 30000).unref()
