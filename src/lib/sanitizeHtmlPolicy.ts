const ALLOWED_IFRAME_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'www.facebook.com',
  'platform.twitter.com',
  'www.instagram.com',
  'w.soundcloud.com',
])

export function isAllowedIframeSource(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ALLOWED_IFRAME_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}
