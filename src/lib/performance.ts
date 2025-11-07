export const performanceConfig = {
  // Image optimization
  imageQuality: 80,
  imageFormats: ['webp', 'avif'] as const,
  
  // Lazy loading
  lazyLoadOffset: 100, // pixels from viewport to start loading
  
  // Prefetching
  prefetchOnHover: true,
  prefetchDelay: 100, // ms delay before prefetch
  
  // Cache strategies
  cacheDurations: {
    categories: 10 * 60 * 1000, // 10 minutes
    articles: 2 * 60 * 1000, // 2 minutes
    videos: 5 * 60 * 1000, // 5 minutes
  }
}

// Enable performance monitoring
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    console.log(metric)
  }
}