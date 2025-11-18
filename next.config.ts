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
    formats: ['image/avif', 'image/webp'],
    domains: ['stage.igihe.com', 'new.igihe.com'],
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
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        }
      ],
    }
  ]

};

export default nextConfig;
