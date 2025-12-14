/** @type {import('next').NextConfig} */

const withPWA = require('@ducanh2912/next-pwa').default;

const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
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
  experimental: {
    // turbopack is now a top-level option
  },
  turbopack: {},
};

module.exports = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true, // Quan trọng: Service worker mới sẽ thay thế cái cũ ngay lập tức
  disable: process.env.NODE_ENV === 'development', // Tắt PWA ở môi trường dev, bật ở production
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 10, // Giới hạn thời gian chờ mạng
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
      },
    },
    {
      urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Year
        },
      },
    },
  ],
  reloadOnOnline: true,
  fallbacks: {
    // Tùy chọn: định nghĩa trang fallback khi offline
    // document: '/~offline',
  },
  workboxOptions: {
    clientsClaim: true, // Quan trọng: Buộc các client (tab) đang mở phải sử dụng service worker mới
  },
})(nextConfig);
