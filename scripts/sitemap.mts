#!/usr/bin/env node
// Sitemap operations CLI. Runs on plain Node (>= 22.18 — native TypeScript,
// no build step) with the same code the server uses:
//
//   yarn sitemap generate            incremental sync + validate + write files
//   yarn sitemap generate --full     re-read every article from WordPress
//   yarn sitemap validate --budget 2000 [--strict]
//   yarn sitemap audit-authors [--write]
//   yarn sitemap status
//
// Reads .env.local for NEXT_PUBLIC_WORDPRESS_API_URL / NEXT_PUBLIC_APP_URL.

import { parseArgs } from 'node:util'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { consoleLogger, regenerateSitemaps } from '../src/lib/sitemap/generate.ts'
import { findAuthorAliasGroups, renderAuthorAliasModule } from '../src/lib/sitemap/authors.ts'
import { buildEntries } from '../src/lib/sitemap/build.ts'
import { MIN_AUTHOR_POSTS, SITE_URL } from '../src/lib/sitemap/config.ts'
import { fetchBylines } from '../src/lib/sitemap/sources.ts'
import { getStoreDir, loadInventory, loadManifest, loadValidationCache, saveValidationCache } from '../src/lib/sitemap/store.ts'
import type { AuthorAliasGroup } from '../src/lib/sitemap/types.ts'
import { classify, runValidation, summarizeFailures } from '../src/lib/sitemap/validate.ts'

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    full: { type: 'boolean', default: false },
    'no-validate': { type: 'boolean', default: false },
    budget: { type: 'string' },
    strict: { type: 'boolean', default: false },
    write: { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
  },
})

const command = positionals[0] ?? 'status'

function budget(): number | undefined {
  return values.budget ? Number(values.budget) : undefined
}

async function generate(): Promise<void> {
  const report = await regenerateSitemaps({
    mode: values.full ? 'full' : 'incremental',
    reason: 'cli',
    validate: !values['no-validate'],
    validationBudget: budget(),
    log: consoleLogger,
  })
  if (values.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log('\nFiles:')
    for (const file of report.files) console.log(`  ${file.path.padEnd(28)} ${String(file.urlCount).padStart(6)} URLs  lastmod ${file.lastmod}`)
    console.log(`\nInventory: ${report.inventory.articles} articles, ${report.inventory.videos} videos, ${report.inventory.categories} categories, ${report.inventory.bylines} bylines`)
    if (report.validation) {
      const v = report.validation
      const guarded = v.excludedUrls.filter(item => item.guarded)
      console.log(`Validation: ${v.checked} fetched, ${v.cached} cached OK, ${v.pending} pending, ${v.excluded} excluded${guarded.length ? `, ${guarded.length} guarded (kept despite failing)` : ''}${v.aborted ? ` (ABORTED: ${v.aborted})` : ''}`)
      for (const item of v.excludedUrls.filter(i => !i.guarded)) console.log(`  EXCLUDED ${item.url}\n           ${item.reason}`)
      for (const item of guarded) console.log(`  GUARDED  ${item.url}  (kept — mass failure looked systemic)\n           ${item.reason}`)
    }
    console.log(`Store: ${getStoreDir()}`)
  }
  if (values.strict && report.validation && report.validation.excluded > 0) process.exitCode = 1
}

async function validate(): Promise<void> {
  const inventory = await loadInventory()
  if (!inventory.syncedAt) throw new Error('No inventory yet — run `yarn sitemap generate` first')
  const entries = buildEntries(inventory)
  const targets = [...entries.pages, ...entries.categories, ...entries.videos, ...entries.authors, ...entries.articles]
  const cache = await loadValidationCache()
  const result = await runValidation(targets, cache, { budget: budget(), log: consoleLogger })
  await saveValidationCache(result.cache)
  const excluded = targets.filter(target => classify(target, result.cache) === 'excluded')
  const pending = targets.filter(target => classify(target, result.cache) === 'pending').length
  console.log(`Fetched ${result.checked} of ${result.due} due URL(s); ${excluded.length} excluded, ${pending} still pending`)
  for (const target of excluded) console.log(`  EXCLUDED ${target.url}\n           ${result.cache[target.url]?.reason}`)
  if (result.aborted) console.log(`ABORTED: ${result.aborted}`)
  const failures = summarizeFailures(result.outcomes)
  if (failures.length) {
    console.log('\nFailures this run by reason:')
    for (const group of failures) console.log(`  ${String(group.count).padStart(5)} × ${group.reason}\n          e.g. ${group.sample}`)
  }

  console.log('Re-run `yarn sitemap generate` to write files with the new verdicts.')
  if (values.strict && excluded.length > 0) process.exitCode = 1
}

async function auditAuthors(): Promise<void> {
  const bylines = await fetchBylines()
  const { auto, review } = findAuthorAliasGroups(bylines)
  const fmt = (group: { canonical: { slug: string; count: number }; aliases: Array<{ slug: string; count: number }> }) =>
    `${group.canonical.slug} (${group.canonical.count}) <- ${group.aliases.map(alias => `${alias.slug} (${alias.count})`).join(', ')}`

  console.log(`${bylines.length} bylines; ${bylines.filter(b => b.count >= MIN_AUTHOR_POSTS).length} have >= ${MIN_AUTHOR_POSTS} posts`)
  console.log(`\n${auto.length} alias group(s) applied automatically:`)
  auto.forEach(group => console.log(`  [${group.confidence}] ${fmt(group)}`))
  console.log(`\n${review.length} looser match(es) for editorial review (not applied):`)
  review.forEach(group => console.log(`  [fuzzy] ${fmt(group)}`))

  const groups: AuthorAliasGroup[] = auto.map(group => ({
    canonical: group.canonical.slug,
    canonicalId: group.canonical.id,
    name: group.canonical.name,
    confidence: group.confidence,
    aliases: group.aliases.map(alias => ({ slug: alias.slug, id: alias.id, name: alias.name, count: alias.count })),
  }))

  const generatedAt = new Date().toISOString()
  if (values.write) {
    const target = path.join(process.cwd(), 'src', 'data', 'authorAliases.ts')
    await fs.writeFile(target, renderAuthorAliasModule(groups, generatedAt), 'utf8')
    console.log(`\nWrote ${groups.length} group(s) to ${path.relative(process.cwd(), target)}`)

    const report = [
      '# Author byline merge report',
      '',
      `Generated ${generatedAt} from ${bylines.length} WordPress \`byline\` terms.`,
      '',
      'The frontend already treats each group below as one author (aliases redirect to the',
      'canonical page and their articles are listed together). To finish the clean-up, merge',
      'the alias terms into the canonical term in WordPress (Posts → Bylines, or a term-merge',
      'plugin), then re-run `yarn sitemap audit-authors --write`.',
      '',
      '## Applied automatically',
      '',
      '| Canonical | Posts | Merged aliases | Confidence |',
      '|---|---:|---|---|',
      ...auto.map(group => `| \`${group.canonical.slug}\` | ${group.canonical.count} | ${group.aliases.map(alias => `\`${alias.slug}\` (${alias.count})`).join(', ')} | ${group.confidence} |`),
      '',
      '## Needs an editorial decision',
      '',
      'Two edits apart — plausibly the same person, but not applied without a human check.',
      '',
      '| Keep | Posts | Possible duplicate | Posts |',
      '|---|---:|---|---:|',
      ...review.map(group => `| \`${group.canonical.slug}\` | ${group.canonical.count} | \`${group.aliases[0].slug}\` | ${group.aliases[0].count} |`),
      '',
      '## Excluded from the sitemap regardless',
      '',
      `Author archives with fewer than ${MIN_AUTHOR_POSTS} published articles are not listed`,
      `(${bylines.filter(b => b.count < MIN_AUTHOR_POSTS).length} of ${bylines.length} bylines). Change \`SITEMAP_MIN_AUTHOR_POSTS\` to adjust.`,
      '',
    ].join('\n')
    const reportPath = path.join(process.cwd(), 'docs', 'author-merge-report.md')
    await fs.writeFile(reportPath, report, 'utf8')
    console.log(`Wrote ${path.relative(process.cwd(), reportPath)}`)
  } else {
    console.log('\nRe-run with --write to update src/data/authorAliases.ts and docs/author-merge-report.md')
  }
}

async function status(): Promise<void> {
  const [manifest, inventory] = await Promise.all([loadManifest(), loadInventory()])
  console.log(`Store:      ${getStoreDir()}`)
  console.log(`Site:       ${SITE_URL}`)
  console.log(`Inventory:  ${inventory.articles.length} articles, ${inventory.videos.length} videos, ${inventory.categories.length} categories, ${inventory.bylines.length} bylines`)
  console.log(`Synced:     ${inventory.syncedAt ?? 'never'} (full: ${inventory.fullSyncAt ?? 'never'})`)
  console.log(`Generated:  ${manifest.generatedAt || 'never'}`)
  if (manifest.lastRun) {
    const run = manifest.lastRun
    console.log(`Last run:   ${run.mode} (${run.reason}) ${run.ok ? 'ok' : `FAILED: ${run.error}`} in ${run.durationMs} ms at ${run.finishedAt}`)
  }
  for (const file of Object.values(manifest.files)) {
    console.log(`  ${file.path.padEnd(28)} ${String(file.urlCount).padStart(6)} URLs  lastmod ${file.lastmod}`)
  }
  if (manifest.validation) {
    const v = manifest.validation
    const guarded = v.excludedUrls.filter(item => item.guarded)
    console.log(`Validation: ${v.excluded} excluded, ${v.pending} pending${guarded.length ? `, ${guarded.length} guarded (kept despite failing)` : ''}${v.aborted ? ` (last run aborted: ${v.aborted})` : ''}`)
    for (const item of v.excludedUrls.filter(i => !i.guarded)) console.log(`  EXCLUDED ${item.url} — ${item.reason}`)
    for (const item of guarded) console.log(`  GUARDED  ${item.url} — kept despite failing: ${item.reason}`)
  }
}

const commands: Record<string, () => Promise<void>> = { generate, validate, 'audit-authors': auditAuthors, status }

const run = commands[command]
if (!run) {
  console.error(`Unknown command "${command}". Use: generate | validate | audit-authors | status`)
  process.exit(2)
}
run().catch(error => {
  console.error(error instanceof Error ? error.stack ?? error.message : error)
  process.exit(1)
})
