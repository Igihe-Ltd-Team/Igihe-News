// // lib/utils.ts
// import { NewsItem } from '@/types/fetchData'
// import { type ClassValue, clsx } from 'clsx'
// import { twMerge } from 'tailwind-merge'

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs))
// }

// export function formatDate(dateString: string): string {
//   const date = new Date(dateString)
//   const now = new Date()
//   const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

//   if (diffInHours < 1) {
//     return 'Just now'
//   } else if (diffInHours < 24) {
//     const hours = Math.floor(diffInHours)
//     return `${hours} hour${hours > 1 ? 's' : ''} ago`
//   } else if (diffInHours < 168) { // 7 days
//     const days = Math.floor(diffInHours / 24)
//     return `${days} day${days > 1 ? 's' : ''} ago`
//   } else {
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     })
//   }
// }

// export function formatDateTime(dateString: string): string {
//   const date = new Date(dateString);

//   const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
//                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

//   const month = months[date.getMonth()];
//   const day = date.getDate();
//   const year = date.getFullYear();

//   let hours = date.getHours();
//   const minutes = date.getMinutes().toString().padStart(2, "0");

//   const ampm = hours >= 12 ? "PM" : "AM";
//   hours = hours % 12 || 12; // convert 0 → 12 and 13-23 → 1-11

//   return `On ${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
// }


// export function truncateText(text: string, maxLength: number): string {
//   if (text.length <= maxLength) return text
//   return text.substring(0, maxLength).trim() + '...'
// }

// // export function stripHtml(html: string): string {
// //   return html.replace(/<[^>]*>/g, '')
// // }


// export const stripHtml = (html:string) => {
//     if (!html) return '';
//     return html
//     .replace(/<\/p>/gi, '\n\n')          // keep paragraph spacing
//     .replace(/<br\s*\/?>/gi, '\n')       // handle <br> tags
//     .replace(/<[^>]+>/g, '')             // remove other HTML tags
//     .replace(/&#8220;|&#8221;|&#8217;|&nbsp;/g, '')
//     .replace(/&amp;/g, '&')
//     .replace(/&#8216;|&#8217;/g, "'")
//     .replace(/&#8211;/g, '-')
//     .replace(/\s+/g, ' ')
//     .trim();
// };


// // Alternative: More robust version with fallbacks
// export const getFeaturedImage = (articleData: NewsItem) => {
//   // console.log(articleData)
//     if (!articleData) return null;
    
//     // Check if _embedded data exists and has featured media
//     const featuredMedia = articleData._embedded?.['wp:featuredmedia']?.[0];
    
//     if (featuredMedia?.source_url) {
//         return featuredMedia.source_url;
//     }
    
//     // Fallback: Check if there's a featured_media ID but no embedded data
//     if (articleData.featured_media && !featuredMedia) {
//         console.warn('Featured media ID exists but no embedded data. Consider adding _embed to API call.');
//     }
    
//     return null;
// }

// // Get multiple image sizes
// export const getFeaturedImageWithSizes = (articleData: NewsItem) => {
//     if (!articleData?._embedded?.['wp:featuredmedia']?.[0]) {
//         return null;
//     }
    
//     const media = articleData._embedded['wp:featuredmedia'][0];
    
//     return {
//         original: media.source_url,
//         large: media.media_details?.sizes?.large?.source_url || media.source_url,
//         medium: media.media_details?.sizes?.medium?.source_url || media.source_url,
//         thumbnail: media.media_details?.sizes?.thumbnail?.source_url || media.source_url,
//         alt: media.alt_text || articleData.title.rendered,
//         caption: media.caption?.rendered || ''
//     };
// }




// export const getCategoryName = (articleData:NewsItem) => {
//     if (articleData?._embedded && articleData?._embedded['wp:term'] && articleData?._embedded['wp:term'][0]) {
//         return articleData?._embedded['wp:term'][0][0]?.name || 'General';
//     }
//     return 'General';
// };
// export const getCategorySlug = (articleData:NewsItem) => {
//     if (articleData?._embedded && articleData?._embedded['wp:term'] && articleData?._embedded['wp:term'][0]) {
//         return articleData?._embedded['wp:term'][0][0]?.slug || 'General';
//     }
//     return 'General';
// };



// export const extractYouTubeEmbed = (html: string): string | null => {
//   if (!html) return null;
//   const youtubeRegex = /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/;
//   const match = html.match(youtubeRegex);
//   return match ? match[1] : null;
// };

// export const getYouTubeVideoId = (url:string) => {
//     if (!url) return null;
//     const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
//     const match = url.match(regex);
//     return match ? match[1] : null;
// };



// export const categoryIcons = [
//   {
//     icon: 'institution',
//     en: 'politics',
//     fr: '',
//     kin: ''
//   }, {
//     icon: 'bi-heart-pulse-fill',
//     fr: '',
//     kin: ''
//   }, {
//     icon: 'bi-trophy-fill',
//     en: 'sports',
//     fr: '',
//     kin: ''
//   }, {
//     icon: 'bi-bullseye',
//     en: 'entertainment',
//     fr: '',
//     kin: ''
//   }, {
//     icon: 'bi-laptop',
//     en: 'technology',
//     fr: '',
//     kin: ''
//   }, {
//     icon: 'bi-translate',
//     en: 'culture',
//     fr: '',
//     kin: ''
//   }, {
//     icon: 'bi-airplane-fill',
//     en: 'tourism',
//     fr: '',
//     kin: ''
//   }, {
//     icon: 'bi-graph-up-arrow',
//     en: 'economy',
//     fr: '',
//     kin: ''
//   }, {
//     icon: 'bi-people-fill',
//     en: 'people',
//     fr: '',
//     kin: ''
//   }, {
//     icon: 'bi-fire',
//     en: 'environment',
//     fr: '',
//     kin: ''
//   }, {
//     icon: 'mosque',
//     en: 'religion',
//     fr: '',
//     kin: ''
//   }, {
//     icon: 'bi-newspaper',
//     en: 'news',
//     fr: '',
//     kin: ''
//   }, {
//     icon: 'bi-globe-europe-africa',
//     en: 'africa',
//     fr: '',
//     kin: ''
//   },{
//     icon: 'ideal',
//     en: 'opinion',
//     fr: '',
//     kin: ''
//   },

// ]




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

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // convert 0 → 12 and 13-23 → 1-11

  return `On ${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
}


export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

// export function stripHtml(html: string): string {
//   return html.replace(/<[^>]*>/g, '')
// }


export const stripHtml = (html: string) => {
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
  // console.log(articleData)
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

export function isImageMedia(featuredMedia: NewsItem): {
  isImage: boolean,
  filePath: string,
  slug: string,
  img: string
} {
  if (!featuredMedia) return {
    isImage: false,
    filePath: '/',
    slug: '',
    img: ''
  };
  const media2 = featuredMedia._embedded?.['wp:featuredmedia']?.[0];
  const media = featuredMedia.acf?.file_source;

  return {
    isImage: media?.type !== 'file' || false,
    filePath: media?.formatted_value?.url || '',
    slug: featuredMedia?.slug || '',
    img: media2?.source_url || ''
  };
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



export function injectGalleryImages(article: any) {
  if (!article) return "";

  let content = article?.content?.rendered || "";
  const gallery = article?.acf?.gallery_images || [];

  // Regex now handles <doc12345> or <doc12345|center>
  const regex = /<doc(\d+)(?:\|(\w+))?>/g;

  return content.replace(regex, (match:any, docId:any, align:any) => {
    const imageItem = gallery.find((g: any) => g.id_document == docId);

    if (!imageItem) {
      console.warn(`Image for doc${docId} not found`);
      return "";
    }

    const imageUrl = `https://en.igihe.com/IMG/${imageItem.image}`;

    // default alignment is center
    const alignment = align || "center";

    return `
      <figure class="gallery-image gallery-${alignment}">
        <img 
          src="${imageUrl}" 
          alt="${imageItem.image_title || ""}"
          width="${imageItem.image_width}" 
          height="${imageItem.image_height}"
        />
      </figure>
    `;
  });
}






export const getCategoryName = (articleData: NewsItem) => {
  if (articleData?._embedded && articleData?._embedded['wp:term'] && articleData?._embedded['wp:term'][0]) {
    return articleData?._embedded['wp:term'][0][0]?.name || 'General';
  }
  return 'General';
};
export const getCategorySlug = (articleData: NewsItem) => {
  if (articleData?._embedded && articleData?._embedded['wp:term'] && articleData?._embedded['wp:term'][0]) {
    return articleData?._embedded['wp:term'][0][0]?.slug || 'General';
  }
  return 'General';
};



export const extractYouTubeEmbed = (html: string): string | null => {
  if (!html) return null;
  const youtubeRegex = /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/;
  const match = html.match(youtubeRegex);
  return match ? match[1] : null;
};

export const getYouTubeVideoId = (url: string) => {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};



export const categoryIcons = [
  {
    icon: 'institution',
    en: 'politics',
    fr: '',
    kin: ''
  }, {
    icon: 'bi-heart-pulse-fill',
    fr: '',
    kin: ''
  }, {
    icon: 'bi-trophy-fill',
    en: 'sports',
    fr: '',
    kin: ''
  }, {
    icon: 'bi-bullseye',
    en: 'entertainment',
    fr: '',
    kin: ''
  }, {
    icon: 'bi-laptop',
    en: 'technology',
    fr: '',
    kin: ''
  }, {
    icon: 'bi-translate',
    en: 'culture',
    fr: '',
    kin: ''
  }, {
    icon: 'bi-airplane-fill',
    en: 'tourism',
    fr: '',
    kin: ''
  }, {
    icon: 'bi-graph-up-arrow',
    en: 'economy',
    fr: '',
    kin: ''
  }, {
    icon: 'bi-people-fill',
    en: 'people',
    fr: '',
    kin: ''
  }, {
    icon: 'bi-fire',
    en: 'environment',
    fr: '',
    kin: ''
  }, {
    icon: 'mosque',
    en: 'religion',
    fr: '',
    kin: ''
  }, {
    icon: 'bi-newspaper',
    en: 'news',
    fr: '',
    kin: ''
  }, {
    icon: 'bi-globe-europe-africa',
    en: 'africa',
    fr: '',
    kin: ''
  }, {
    icon: 'ideal',
    en: 'opinion',
    fr: '',
    kin: ''
  },

]