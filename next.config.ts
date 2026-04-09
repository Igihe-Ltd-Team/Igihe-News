// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   poweredByHeader: false,
//   productionBrowserSourceMaps: false,
//   staticPageGenerationTimeout: 600,
//   compress: true,
//   experimental: {
//     optimizeCss: true,
//     optimizePackageImports: ['react-bootstrap', 'react-icons'],
//     taint: true,
//   },
//   compiler: {
//     removeConsole: process.env.NODE_ENV === 'production',
//   },
//   reactCompiler: true,
//   images: {
//     formats: ['image/avif', 'image/webp'],
//    contentDispositionType: 'attachment',
//     deviceSizes: [640, 750, 828, 1080, 1200, 1920],
//     imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
//     minimumCacheTTL: 60 * 60 * 24 * 30,
//     remotePatterns: [
//       { protocol: "https", hostname: "en.igihe.com",         pathname: "/**" },
//       { protocol: "https", hostname: "en-images.igihe.com",  pathname: "/**" },
//       { protocol: "https", hostname: "secure.gravatar.com",  pathname: "/avatar/**" },
//       { protocol: "https", hostname: "img.youtube.com",      pathname: "/**" },
//       { protocol: "https", hostname: "stage.igihe.com",      pathname: "/_next/image" },
//       { protocol: "https", hostname: "new.igihe.com",        pathname: "/wp-content/uploads/**" },
//     ],
//     unoptimized: true,
//   },

//   headers: async () => [
//     {
//       source: '/((?!_next/static|_next/image|favicon.ico).*)',
//       headers: [
//         { key: 'X-Content-Type-Options', value: 'nosniff' },
//         { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
//         { key: 'X-XSS-Protection',       value: '1; mode=block' },
//         { key: 'Cache-Control',          value: 'no-cache, no-store, must-revalidate' },
//         { key: 'Pragma',                 value: 'no-cache' },
//         { key: 'Expires',                value: '0' },
//       ],
//     },
//     {
//       source: '/_next/static/(.*)',
//       headers: [
//         { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
//       ],
//     },
//     {
//       // ── Optimized images ─────────────────────────────────────────────────
//       source: '/_next/image(.*)',
//       headers: [
//         { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
//       ],
//     },
//   ],
// };

// export default nextConfig;





import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  staticPageGenerationTimeout: 600,
  compress: true,

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-bootstrap', 'react-icons'],
    taint: true,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  reactCompiler: true,

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
      { protocol: "https", hostname: "en.igihe.com",        pathname: "/**" },
      { protocol: "https", hostname: "en-images.igihe.com", pathname: "/**" },
      { protocol: "https", hostname: "secure.gravatar.com", pathname: "/avatar/**" },
      { protocol: "https", hostname: "img.youtube.com",     pathname: "/**" },
      { protocol: "https", hostname: "stage.igihe.com",     pathname: "/_next/image" },
      { protocol: "https", hostname: "new.igihe.com",       pathname: "/wp-content/uploads/**" },
    ],
    unoptimized: true,
  },

  headers: async () => [
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
      // ✅ Static chunks: cache forever (hash in filename = safe)
      source: '/_next/static/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      // ✅ Optimized images: cache with revalidation
      source: '/_next/image(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
      ],
    },
    {
      // ✅ HTML pages only: no-cache (revalidate, but allow serving stale)
      // This replaces your overly broad rule
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
        { key: 'X-XSS-Protection',       value: '1; mode=block' },
        // ✅ no-cache (must revalidate) but NOT no-store (allows conditional requests)
        { key: 'Cache-Control',          value: 'no-cache' },
      ],
    },
  ],
};

export default nextConfig;