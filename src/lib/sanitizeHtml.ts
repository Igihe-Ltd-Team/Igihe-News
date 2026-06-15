import DOMPurify from 'isomorphic-dompurify'
import { isAllowedIframeSource } from './sanitizeHtmlPolicy'

export function sanitizeArticleHtml(html: string): string {
  const iframeSourceGuard = (
    node: Element,
    data: { attrName: string; attrValue: string; keepAttr: boolean }
  ) => {
    if (
      node.nodeName.toLowerCase() === 'iframe' &&
      data.attrName === 'src' &&
      !isAllowedIframeSource(data.attrValue)
    ) {
      data.keepAttr = false
      node.remove()
    }
  }

  DOMPurify.addHook('uponSanitizeAttribute', iframeSourceGuard)
  try {
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allowfullscreen', 'frameborder', 'src', 'allow', 'loading'],
    })
  } finally {
    DOMPurify.removeHook('uponSanitizeAttribute')
  }
}
