import { isAllowedIframeSource } from '@/lib/sanitizeHtmlPolicy'

describe('article iframe policy', () => {
  it('allows known HTTPS embed hosts', () => {
    expect(isAllowedIframeSource('https://www.youtube.com/embed/video-id')).toBe(true)
    expect(isAllowedIframeSource('https://player.vimeo.com/video/123')).toBe(true)
  })

  it('rejects unknown, insecure, and malformed sources', () => {
    expect(isAllowedIframeSource('https://attacker.example/embed')).toBe(false)
    expect(isAllowedIframeSource('http://www.youtube.com/embed/video-id')).toBe(false)
    expect(isAllowedIframeSource('not-a-url')).toBe(false)
  })
})
