import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com https://traffic.igihe.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.facebook.com https://www.instagram.com https://w.soundcloud.com",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  staticPageGenerationTimeout: 600,
  compress: true,

  experimental: {
    optimizeCss: process.env.NODE_ENV === 'production',
    optimizePackageImports: ['react-bootstrap', 'react-icons'],
    taint: true,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  reactCompiler: process.env.NODE_ENV === 'production',

  // Use git commit as build ID so chunks are consistent across instances
  generateBuildId: async () => {
    try {
      return require('child_process')
        .execSync('git rev-parse HEAD')
        .toString().trim()
    } catch {
      return `build-${Date.now()}`
    }
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    contentDispositionType: 'attachment',
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "en.igihe.com", pathname: "/**" },
      { protocol: "https", hostname: "en-images.igihe.com", pathname: "/**" },
      { protocol: "https", hostname: "secure.gravatar.com", pathname: "/avatar/**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },
      { protocol: "https", hostname: "en.igihe.com", pathname: "/_next/image" },
      { protocol: "https", hostname: "new.igihe.com", pathname: "/**" },
      { protocol: "https", hostname: "igihe.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.igihe.com", pathname: "/**" },
    ],
    unoptimized: false,
  },

  headers: async () => [
    {
      source: "/.well-known/apple-app-site-association",
      headers: [
        {
          key: "Content-Type",
          value: "application/json",
        },
      ],
    },
    {
      source: "/.well-known/assetlinks.json",
      headers: [{ key: "Content-Type", value: "application/json" }],
    },
    {
      source: '/sitemap.xml',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
        {
          key: 'Content-Type',
          value: 'application/xml',
        },
      ],
    },

    {
      source: '/robots.txt',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
        {
          key: 'Content-Type',
          value: 'text/plain',
        },
      ],
    },

    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        // Revalidate dynamic HTML while allowing conditional requests.
        { key: 'Cache-Control', value: 'no-cache' },
      ],
    },
  ],

  async rewrites() {
  return [
    {
      source: "/.well-known/assetlinks.json",
      destination: "/api/assetlinks",
    },
    {
      source: "/.well-known/apple-app-site-association",
      destination: "/api/apple-app-site-association",
    },
  ];
},
};




export default nextConfig;
