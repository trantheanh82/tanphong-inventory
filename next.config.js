/** @type {import('next').NextConfig} */

const withPWA = require('@ducanh2912/next-pwa').default;

const nextConfig = {
  output: 'standalone',
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
        hostname: 'tanphong.nola.ai.vn',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: true,
})(nextConfig);
