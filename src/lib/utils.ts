// lib/utils.ts
import { NewsItem } from '@/types/fetchData'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInHours < 168) { // 7 days
    const days = Math.floor(diffInHours / 24)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

// export function stripHtml(html: string): string {
//   return html.replace(/<[^>]*>/g, '')
// }


export const stripHtml = (html:string) => {
    if (!html) return '';
    return html?.replace(/<[^>]*>/g, '').replace(/&#8220;|&#8221;|&#8217;|&nbsp;/g, '')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/&amp;/g, '&')
        .replace(/&#8211;/g, '-');

    // return html
    //   // Remove all HTML tags
    //   .replace(/<[^>]*>/g, '')
    //   // Replace multiple newlines with single newline
    //   .replace(/\n\s*\n\s*\n/g, '\n\n')
    //   // Replace single newlines with space
    //   .replace(/([^\.\?\!])\n/g, '$1 ')
    //   // Clean up HTML entities
    //   .replace(/&#8220;|&#8221;/g, '"')
    //   .replace(/&#8216;|&#8217;/g, "'")
    //   .replace(/&#8211;/g, '-')
    //   .replace(/&nbsp;/g, ' ')
    //   .replace(/&amp;/g, '&')
    //   // Trim whitespace
    //   .trim()
    //   // Remove extra spaces
    //   .replace(/\s+/g, ' ');
};

export const getFeaturedImage = (articleData:NewsItem) => {
    if (articleData?._embedded && articleData?._embedded['wp:featuredmedia']) {
        return articleData?._embedded['wp:featuredmedia'][0]?.source_url;
    }
    return null;
};

export const getCategoryName = (articleData:NewsItem) => {
    if (articleData?._embedded && articleData?._embedded['wp:term'] && articleData?._embedded['wp:term'][0]) {
        return articleData?._embedded['wp:term'][0][0]?.name || 'General';
    }
    return 'General';
};