
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true, // It's a good default to have enabled
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'urmarketprints.com',
        pathname: '/**',
      },
    ],
  },
  // The redirect for /page to / was removed temporarily to simplify.
  // We can add it back once the main 404 issue is resolved.
};

export default nextConfig;
