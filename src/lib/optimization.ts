export const optimizationConfig = {
  // Image optimization
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  
  // ISR (Incremental Static Regeneration)
  revalidate: {
    home: 60, // 1 minute
    category: 120, // 2 minutes
    article: 300, // 5 minutes
  },
  
  // Cache strategies
  cache: {
    api: {
      maxAge: 60, // seconds
      staleWhileRevalidate: 300,
    },
    image: {
      maxAge: 86400, // 1 day
    }
  }
}