import type { AuthorAliasGroup, BylineRecord } from './types.ts'
import { authorAliases } from '../../data/authorAliases.ts'

// ─── Runtime alias resolution (used by the author page and the sitemap) ─────

interface AliasIndex {
  byAlias: Map<string, AuthorAliasGroup>
  byCanonical: Map<string, AuthorAliasGroup>
}

let index: AliasIndex | null = null

function getIndex(): AliasIndex {
  if (index) return index
  const byAlias = new Map<string, AuthorAliasGroup>()
  const byCanonical = new Map<string, AuthorAliasGroup>()
  for (const group of authorAliases.groups) {
    byCanonical.set(group.canonical, group)
    for (const alias of group.aliases) byAlias.set(alias.slug, group)
  }
  index = { byAlias, byCanonical }
  return index
}

/** Test hook: rebuild the lookup index after the alias data module changes. */
export function resetAuthorAliasIndex(): void {
  index = null
}

export function isAuthorAlias(slug: string): boolean {
  return getIndex().byAlias.has(slug)
}

/** The slug an author URL should use — the canonical spelling for aliases, the input otherwise. */
export function resolveAuthorSlug(slug: string): string {
  return getIndex().byAlias.get(slug)?.canonical ?? slug
}

/** Every byline term id whose posts belong on the given author's page. */
export function getAuthorBylineIds(slug: string, ownId?: number): number[] {
  const group = getIndex().byCanonical.get(slug) ?? getIndex().byAlias.get(slug)
  const ids = new Set<number>()
  if (ownId) ids.add(ownId)
  if (group) {
    ids.add(group.canonicalId)
    group.aliases.forEach(alias => ids.add(alias.id))
  }
  return [...ids]
}

export function getAuthorAliasGroups(): AuthorAliasGroup[] {
  return authorAliases.groups
}

// ─── Near-duplicate detection (used by `yarn sitemap audit-authors`) ────────

const HONORIFIC_PREFIX = /^(?:by|dr|prof|mr|mrs|ms|hon|sir|amb|ambassador|h-e|he|rev|fr|eng|dr-eng)-/

/**
 * Collapses a byline slug to a comparison key: drops WordPress's `-2`/`-3`
 * duplicate suffixes, honorific prefixes and everything but letters, so
 * `dr-donald-kaberuka`, `donald-kaberuka-2` and `donaldkaberuka` all agree.
 */
export function normalizeAuthorKey(slug: string): string {
  return cleanSlug(slug).replace(/[^a-z]/g, '')
}

/**
 * Same as normalizeAuthorKey but with the name parts sorted, so
 * `hakizimana-thamim` and `thamimu-hakizimana` compare as one edit apart.
 */
export function normalizeAuthorKeySorted(slug: string): string {
  return cleanSlug(slug)
    .split('-')
    .map(part => part.replace(/[^a-z]/g, ''))
    .filter(Boolean)
    .sort()
    .join('')
}

function cleanSlug(slug: string): string {
  let key = slug.toLowerCase().trim()
  key = key.replace(/-\d+$/, '')
  return key.replace(HONORIFIC_PREFIX, '')
}

/** Optimal-string-alignment Damerau-Levenshtein distance with an early cutoff. */
export function damerauLevenshtein(a: string, b: string, max: number): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev2: number[] | null = null
  let prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = new Array(b.length + 1)
    cur[0] = i
    let rowMin = cur[0]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, prev2[j - 2] + 1)
      }
      cur[j] = value
      if (value < rowMin) rowMin = value
    }
    if (rowMin > max) return max + 1
    prev2 = prev
    prev = cur
  }
  return prev[b.length]
}

export interface DetectedGroup {
  canonical: BylineRecord
  aliases: BylineRecord[]
  confidence: 'exact' | 'typo' | 'fuzzy'
}

export interface AliasDetectionOptions {
  /** Minimum key length before a one-edit difference counts as a typo. */
  typoMinLength?: number
  /** Minimum key length before a two-edit difference is suggested for review. */
  fuzzyMinLength?: number
}

class UnionFind {
  private parent = new Map<string, string>()
  find(x: string): string {
    let root = x
    while (this.parent.get(root) !== undefined && this.parent.get(root) !== root) root = this.parent.get(root)!
    return root
  }
  union(a: string, b: string): void {
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra !== rb) this.parent.set(ra, rb)
  }
}

function pickCanonical(members: BylineRecord[]): BylineRecord {
  // Most-used spelling wins; ties go to the slug without a numeric suffix,
  // then to the shorter one.
  return [...members].sort((x, y) =>
    y.count - x.count ||
    Number(/-\d+$/.test(x.slug)) - Number(/-\d+$/.test(y.slug)) ||
    x.slug.length - y.slug.length ||
    x.slug.localeCompare(y.slug)
  )[0]
}

/**
 * Groups bylines that are very likely the same person or source.
 *
 * `auto` groups are safe to apply without review: identical keys after
 * normalisation, or a single edit apart on a reasonably long key (typos such
 * as `al-jaazeera`). `review` groups are looser two-edit matches between
 * auto groups and need a human decision (`elisha-mpirwa` vs `elisee-mpirwa`).
 */
export function findAuthorAliasGroups(
  bylines: BylineRecord[],
  options: AliasDetectionOptions = {}
): { auto: DetectedGroup[]; review: DetectedGroup[] } {
  const typoMin = options.typoMinLength ?? 8
  const fuzzyMin = options.fuzzyMinLength ?? 12
  const keys = new Map<string, string>()
  const uf = new UnionFind()
  const confidence = new Map<string, 'exact' | 'typo'>()

  for (const byline of bylines) keys.set(byline.slug, normalizeAuthorKey(byline.slug))

  const markTypo = (root: string) => {
    if (confidence.get(root) !== 'exact') confidence.set(root, 'typo')
  }

  // Two passes: the natural key catches spelling variants, the token-sorted
  // key additionally catches swapped given/family name order.
  for (const keyFn of [normalizeAuthorKey, normalizeAuthorKeySorted]) {
    const byKey = new Map<string, string[]>()
    for (const byline of bylines) {
      const key = keyFn(byline.slug)
      if (!key) continue
      const list = byKey.get(key) ?? []
      list.push(byline.slug)
      byKey.set(key, list)
    }
    for (const slugs of byKey.values()) {
      for (let i = 1; i < slugs.length; i++) {
        const wasExact = confidence.get(uf.find(slugs[0])) === 'exact' || confidence.get(uf.find(slugs[0])) === undefined
        const otherExact = confidence.get(uf.find(slugs[i])) === 'exact' || confidence.get(uf.find(slugs[i])) === undefined
        uf.union(slugs[0], slugs[i])
        confidence.set(uf.find(slugs[0]), wasExact && otherExact ? 'exact' : 'typo')
      }
    }

    const distinctKeys = [...byKey.keys()].filter(key => key.length >= typoMin)
    for (let i = 0; i < distinctKeys.length; i++) {
      for (let j = i + 1; j < distinctKeys.length; j++) {
        const a = distinctKeys[i]
        const b = distinctKeys[j]
        if (damerauLevenshtein(a, b, 1) <= 1) {
          const sa = byKey.get(a)![0]
          const sb = byKey.get(b)![0]
          if (uf.find(sa) === uf.find(sb)) continue
          uf.union(sa, sb)
          markTypo(uf.find(sa))
        }
      }
    }
  }

  const members = new Map<string, BylineRecord[]>()
  for (const byline of bylines) {
    const root = uf.find(byline.slug)
    const list = members.get(root) ?? []
    list.push(byline)
    members.set(root, list)
  }

  const auto: DetectedGroup[] = []
  for (const [root, list] of members) {
    if (list.length < 2) continue
    const canonical = pickCanonical(list)
    auto.push({
      canonical,
      aliases: list.filter(member => member !== canonical).sort((x, y) => y.count - x.count || x.slug.localeCompare(y.slug)),
      confidence: confidence.get(root) === 'typo' ? 'typo' : 'exact',
    })
  }
  auto.sort((x, y) => y.canonical.count - x.canonical.count || x.canonical.slug.localeCompare(y.canonical.slug))

  // Looser pass between the representatives of the groups above.
  const representatives = [...members.entries()].map(([root, list]) => ({ root, canonical: pickCanonical(list), key: keys.get(root) ?? '' }))
  const review: DetectedGroup[] = []
  for (let i = 0; i < representatives.length; i++) {
    const a = representatives[i]
    if (a.key.length < fuzzyMin) continue
    for (let j = i + 1; j < representatives.length; j++) {
      const b = representatives[j]
      if (b.key.length < fuzzyMin) continue
      if (damerauLevenshtein(a.key, b.key, 2) === 2) {
        const [primary, secondary] = a.canonical.count >= b.canonical.count ? [a, b] : [b, a]
        review.push({ canonical: primary.canonical, aliases: [secondary.canonical], confidence: 'fuzzy' })
      }
    }
  }
  review.sort((x, y) => y.canonical.count - x.canonical.count || x.canonical.slug.localeCompare(y.canonical.slug))

  return { auto, review }
}

export function renderAuthorAliasModule(groups: AuthorAliasGroup[], generatedAt: string): string {
  const body = JSON.stringify({ version: 1, generatedAt, groups }, null, 2)
  return `// Author (byline) slugs that are the same person or source spelled
// inconsistently. Generated by \`yarn sitemap audit-authors --write\` from the
// live byline taxonomy and then reviewed by hand — it is safe to edit.
//
// Effects: alias slugs are excluded from sitemap-authors.xml, /author/<alias>
// redirects (301) to /author/<canonical>, and the canonical author page lists
// articles from every byline in the group. Merging the terms in WordPress
// itself is still the real fix; see docs/author-merge-report.md.
import type { AuthorAliasData } from '../lib/sitemap/types.ts'

export const authorAliases: AuthorAliasData = ${body}
`
}
