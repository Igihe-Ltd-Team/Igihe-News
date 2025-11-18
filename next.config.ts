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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "new.igihe.com",
        pathname: "/**",
      },
    ],
    unoptimized: true,
  },



};

export default nextConfig;
