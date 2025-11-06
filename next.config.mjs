/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization for performance
  images: {
    remotePatterns: [],
    // Optimize image loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache for optimized images
  },

  // Production compilation optimization
  productionBrowserSourceMaps: false, // Reduce bundle size in production

  // Turbopack configuration (Next.js 16+ default)
  turbopack: {
    // Empty config - Turbopack handles most cases automatically
    // Add specific optimizations here if needed
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Enable incremental static regeneration for better performance
  staticPageGenerationTimeout: 300,

  // Compression and caching headers
  headers: async () => {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Rewrites for API routes and cleaner URLs
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },

  // Optimization for large file uploads
  httpAgentOptions: {
    keepAlive: true,
  },

  // Disable PoweredBy header for security
  poweredByHeader: false,
};

export default nextConfig;
