export const config = {
  isr: {
    enabled: process.env.ENABLE_ISR === 'true',
    revalidate: parseInt(process.env.ISR_REVALIDATE || '60'),
  },
  cache: {
    redis: process.env.REDIS_URL,
    ttl: parseInt(process.env.CACHE_TTL || '300'),
  },
  cdn: {
    enabled: process.env.ENABLE_CDN === 'true',
    domain: process.env.CDN_DOMAIN,
  },
  monitoring: {
    enabled: process.env.ENABLE_MONITORING === 'true',
    sampleRate: parseFloat(process.env.MONITORING_SAMPLE_RATE || '0.1'),
  }
}


// lib/config.ts
export const APP_CONFIG = {
  wordpress: {
    apiUrl: process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
    timeout: parseInt(process.env.API_TIMEOUT || '10000'),
    cacheEnabled: process.env.NEXT_PUBLIC_CACHE_ENABLED !== 'false',
  },
  features: {
    comments: process.env.NEXT_PUBLIC_ENABLE_COMMENTS === 'true',
    search: process.env.NEXT_PUBLIC_ENABLE_SEARCH === 'true',
    videos: process.env.NEXT_PUBLIC_ENABLE_VIDEOS === 'true',
  },
  performance: {
    cacheTtl: {
      categories: 10 * 60 * 1000, // 10 minutes
      articles: 2 * 60 * 1000, // 2 minutes
      videos: 5 * 60 * 1000, // 5 minutes
      singlePost: 10 * 60 * 1000, // 10 minutes
    },
    batchRequests: process.env.NEXT_PUBLIC_BATCH_REQUESTS === 'true',
  }
} as const