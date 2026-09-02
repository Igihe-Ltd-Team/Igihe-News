export async function register() {
  // Dynamically imported (rather than called directly) so the Node-only
  // process.on/process.exit calls inside it are never statically bundled
  // into an Edge Runtime build of this file.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node')
  }
}
