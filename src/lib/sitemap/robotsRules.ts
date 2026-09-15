// Shared between app/robots.ts (what we publish) and the sitemap validator
// (what we refuse to list), so the two can never disagree.

export const ROBOTS_DISALLOW: string[] = [
  '/api/',
  '/admin/',
  '/private/',
  '/*?*', // Block URLs with query parameters
  '/_next/',
  '/cdn-cgi/',
]

export const ROBOTS_SITEMAP_PATHS = ['/sitemap-index.xml', '/news-sitemap.xml']

function patternToRegExp(pattern: string): RegExp {
  let source = '^'
  for (const char of pattern) {
    if (char === '*') source += '.*'
    else if (char === '$') source += '$'
    else source += char.replace(/[.+?^${}()|[\]\\/]/g, '\\$&')
  }
  return new RegExp(source)
}

const DISALLOW_PATTERNS = ROBOTS_DISALLOW.map(patternToRegExp)

/** True when the given absolute or root-relative URL matches a Disallow rule for `User-agent: *`. */
export function isBlockedByRobots(url: string): boolean {
  let target: string
  try {
    const parsed = new URL(url, 'https://placeholder.invalid')
    target = `${parsed.pathname}${parsed.search}`
  } catch {
    return true
  }
  return DISALLOW_PATTERNS.some(pattern => pattern.test(target))
}
