export {}

// A rejected promise that nothing ever awaits/catches (a fire-and-forget
// background task, a floating call at module scope, etc.) is, by default,
// fatal in Node — it takes down the whole process and every in-flight
// request for every visitor, not just the one background task that failed.
// Log it loudly instead so a single isolated background failure can't do
// that; fix the source of each one as they're found (see src/app/layout.tsx
// for an example), but keep this as a backstop for ones we haven't yet.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})

// An uncaught synchronous exception leaves the process in a genuinely
// undefined state, so — unlike above — this one still exits. The goal here
// is just to make sure it's logged clearly before PM2 restarts into a
// fresh process, instead of the reason getting lost in a bare crash.
process.on('uncaughtException', (error) => {
  console.error('[uncaughtException]', error)
  process.exit(1)
})
