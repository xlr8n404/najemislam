import type { NextConfig } from "next";

let loaderPath: string | undefined;
try {
  loaderPath = require.resolve('orchids-visual-edits/loader.js');
} catch {
  // loader not available in production build
}

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    remotePatterns: [
      // DiceBear avatars (fallback for users without a profile photo)
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/7.x/**',
      },
    ],
    // All user-uploaded media is served through /api/media (our authenticated proxy),
    // so no external Supabase storage hostname is needed here.
  },
  async redirects() {
      return [
        {
          source: '/notifications',
          destination: '/alerts',
          permanent: true,
        },
      ];
    },
};

export default nextConfig;
// Orchids restart: 1770870689662