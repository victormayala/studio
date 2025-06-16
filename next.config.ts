
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Temporarily removing images configuration for maximum simplicity
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: 'https',
  //       hostname: 'placehold.co',
  //       pathname: '/**',
  //     },
  //     {
  //       protocol: 'https',
  //       hostname: 'urmarketprints.com',
  //       pathname: '/**',
  //     },
  //   ],
  // },
};

export default nextConfig;
