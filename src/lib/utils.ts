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
    return html
    .replace(/<\/p>/gi, '\n\n')          // keep paragraph spacing
    .replace(/<br\s*\/?>/gi, '\n')       // handle <br> tags
    .replace(/<[^>]+>/g, '')             // remove other HTML tags
    .replace(/&#8220;|&#8221;|&#8217;|&nbsp;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#8216;|&#8217;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
};


// Alternative: More robust version with fallbacks
export const getFeaturedImage = (articleData: NewsItem) => {
    if (!articleData) return null;
    
    // Check if _embedded data exists and has featured media
    const featuredMedia = articleData._embedded?.['wp:featuredmedia']?.[0];
    
    if (featuredMedia?.source_url) {
        return featuredMedia.source_url;
    }
    
    // Fallback: Check if there's a featured_media ID but no embedded data
    if (articleData.featured_media && !featuredMedia) {
        console.warn('Featured media ID exists but no embedded data. Consider adding _embed to API call.');
    }
    
    return null;
}

// Get multiple image sizes
export const getFeaturedImageWithSizes = (articleData: NewsItem) => {
    if (!articleData?._embedded?.['wp:featuredmedia']?.[0]) {
        return null;
    }
    
    const media = articleData._embedded['wp:featuredmedia'][0];
    
    return {
        original: media.source_url,
        large: media.media_details?.sizes?.large?.source_url || media.source_url,
        medium: media.media_details?.sizes?.medium?.source_url || media.source_url,
        thumbnail: media.media_details?.sizes?.thumbnail?.source_url || media.source_url,
        alt: media.alt_text || articleData.title.rendered,
        caption: media.caption?.rendered || ''
    };
}




export const getCategoryName = (articleData:NewsItem) => {
    if (articleData?._embedded && articleData?._embedded['wp:term'] && articleData?._embedded['wp:term'][0]) {
        return articleData?._embedded['wp:term'][0][0]?.name || 'General';
    }
    return 'General';
};




export const extractYouTubeEmbed = (html: string): string | null => {
  if (!html) return null;
  const youtubeRegex = /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/;
  const match = html.match(youtubeRegex);
  return match ? match[1] : null;
};

export const extractImagesFromHtml = (html: string): ImageData[] => {
  if (!html) return [];
  
  const images: ImageData[] = [];
  
  // Match figure blocks with images and figcaptions
  const figureRegex = /<figure[^>]*>[\s\S]*?<img[^>]+src="([^">]+)"[^>]*(?:alt="([^"]*)")?[^>]*>[\s\S]*?(?:<figcaption[^>]*>[\s\S]*?<\/figcaption>)?[\s\S]*?<\/figure>/g;
  let figureMatch;
  
  while ((figureMatch = figureRegex.exec(html)) !== null) {
    const url = figureMatch[1];
    const alt = figureMatch[2] || '';
    
    // Extract caption text if present
    const captionMatch = figureMatch[0].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/);
    const caption = captionMatch ? captionMatch[1].replace(/<[^>]*>/g, '').trim() : '';
    
    images.push({ url, alt, caption });
  }
  
  // Also match standalone img tags not in figures
  const standaloneImgRegex = /<img[^>]+src="([^">]+)"[^>]*(?:alt="([^"]*)")?[^>]*>/g;
  const figureImgUrls = new Set(images.map(img => img.url));
  let imgMatch;
  
  while ((imgMatch = standaloneImgRegex.exec(html)) !== null) {
    const url = imgMatch[1];
    // Skip if already captured in a figure
    if (!figureImgUrls.has(url)) {
      const alt = imgMatch[2] || '';
      images.push({ url, alt });
    }
  }
  
  return images;
};