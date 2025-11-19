import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compress: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-bootstrap'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  reactCompiler: true,
  images: {
    domains: ['new.igihe.com', 'igihe.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days

    remotePatterns: [
      {
        protocol: "https",
        hostname: "new.igihe.com",
        pathname: "/**",
      },
    ],
    unoptimized: true,
  },

  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 's-maxage=3600, stale-while-revalidate=86400',
        }
      ],
    }
  ]

};

export default nextConfig;
