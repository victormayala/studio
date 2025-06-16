
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
      // IMPORTANT: Replace 'your-woocommerce-store.com' with the actual hostname 
      // where your WooCommerce product images are served. 
      // This might be your main store domain or a CDN domain.
      {
        protocol: 'https',
        hostname: 'urmarketprints.com', // Placeholder: User needs to change this
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
};

export default nextConfig;
