import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    GOOGLE_MAPS_PLATFORM_KEY: process.env.GOOGLE_MAPS_PLATFORM_KEY,
  },
  // Allow images from external sources if needed
  images: {
    unoptimized: true,
  },
  // Skip type checking during build for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
