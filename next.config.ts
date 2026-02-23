// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */

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
//     deviceSizes: [640, 750, 828, 1080, 1200, 1920],
//     imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
//     minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "en.igihe.com",
//         pathname: "/**",
//       },
//       {
//         protocol: "https",
//         hostname: "en-images.igihe.com",
//         pathname: "/**",
//       },
//       {
//         protocol: 'https',
//         hostname: 'secure.gravatar.com',
//         pathname: '/avatar/**',
//       },
//       {
//         protocol: 'https',
//         hostname: 'img.youtube.com',
//         pathname: '/**',
//       },

//       {
//         protocol: 'https',
//         hostname: 'stage.igihe.com',
//         pathname: '/_next/image',
//       },
//       {
//         protocol: 'https',
//         hostname: 'new.igihe.com',
//         pathname: '/wp-content/uploads/**',
//       },
//     ],
//     unoptimized: false,
//   },

//   headers: async () => [
//     {
//       source: '/(.*)',
//       headers: [
//         { key: 'X-Content-Type-Options', value: 'nosniff' },
//         { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
//         { key: 'X-XSS-Protection', value: '1; mode=block' },
//         {
//           key: 'Cache-Control',
//           value: 's-maxage=3600, stale-while-revalidate=86400,public, immutable, no-transform, max-age=31536000',
//         }
//       ],
//     }
//   ]

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
  images: {
    formats: ['image/avif', 'image/webp'],
   contentDispositionType: 'attachment',
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "en.igihe.com",         pathname: "/**" },
      { protocol: "https", hostname: "en-images.igihe.com",  pathname: "/**" },
      { protocol: "https", hostname: "secure.gravatar.com",  pathname: "/avatar/**" },
      { protocol: "https", hostname: "img.youtube.com",      pathname: "/**" },
      { protocol: "https", hostname: "stage.igihe.com",      pathname: "/_next/image" },
      { protocol: "https", hostname: "new.igihe.com",        pathname: "/wp-content/uploads/**" },
    ],
    unoptimized: true,
  },

  headers: async () => [
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
        { key: 'X-XSS-Protection',       value: '1; mode=block' },
        { key: 'Cache-Control',          value: 'no-cache, no-store, must-revalidate' },
        { key: 'Pragma',                 value: 'no-cache' },
        { key: 'Expires',                value: '0' },
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      // ── Optimized images ─────────────────────────────────────────────────
      source: '/_next/image(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
      ],
    },
  ],
};

export default nextConfig;