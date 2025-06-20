
import type {NextConfig} from 'next';

// Configuration for Next.js
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'urmarketprints.com', 
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/page',
        destination: '/',
        permanent: true,
      },
    ];
  },
  // Minor change to potentially help with build issues
};

export default nextConfig;
