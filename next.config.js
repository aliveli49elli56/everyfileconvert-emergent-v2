/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  transpilePackages: ['node-unrar-js'],
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/sitemap/0.xml',
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/vi',
        destination: '/en',
        permanent: true,
      },
      {
        source: '/vi/:path*',
        destination: '/en/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
