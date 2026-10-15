// Helpers for looking up posts whose WordPress slug contains characters other
// than plain ASCII letters, digits, `-` and `_`.
//
// Deliberately dependency-free (no `@/` aliases) so it can be used from
// route code, shared services, and the plain-Node sitemap scripts alike.

/** True for slugs made only of ASCII letters, digits, `-` and `_` — the ones WordPress can filter on. */
export function isPlainSlug(slug: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(slug)
}

/** Equality for slugs that survives Unicode normalisation (NFC vs NFD accents). */
export function sameSlug(a: string, b: string): boolean {
  return a.normalize('NFC') === b.normalize('NFC')
}

/**
 * Percent-encodes one path segment (RFC 3986). `encodeURIComponent` leaves
 * `!'()*` alone, so those are escaped too.
 */
export function encodeSegment(segment: string): string {
  return encodeURIComponent(segment).replace(/[!'()*]/g, ch => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`)
}

/**
 * Next.js passes a dynamic route param percent-encoded to the page component
 * but decoded to `generateMetadata`, so the same URL can reach the two as
 * `ngug%C4%A9-wa` and `ngugĩ-wa`. Normalise to the decoded form at the top of
 * both. Slugs never contain a literal `%`, so decoding is always safe; a
 * malformed sequence is returned unchanged rather than thrown.
 */
export function decodeSlugParam(value: string): string {
  if (!value.includes('%')) return value
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const MIN_TERM_LENGTH = 4

/**
 * Plain words from a slug that are safe to put in a WordPress `search` query.
 *
 * Invisible format and control characters (zero-width spaces and joiners,
 * directional marks, BOM) are dropped *before* splitting, since they often sit
 * inside words. Unusual space characters become separators. Tokens that still
 * contain non-ASCII characters are discarded rather than folded: whether
 * WordPress matches them depends on database collation. Numbers are discarded
 * because titles often format them differently ("250,000" vs "250000").
 * The longest words come first, since they are the most selective.
 */
export function slugSearchTerms(slug: string, max = 5): string[] {
  const cleaned = slug
    .normalize('NFC')
    .replace(/[\p{Cf}\p{Cc}]/gu, '')
    .replace(/\p{Z}/gu, '-')
    .toLowerCase()

  const terms = new Set<string>()
  for (const token of cleaned.split('-')) {
    if (token.length >= MIN_TERM_LENGTH && /^[a-z]+$/.test(token)) terms.add(token)
  }
  return [...terms].sort((a, b) => b.length - a.length || a.localeCompare(b)).slice(0, max)
}
