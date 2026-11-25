/** @type {import('next').NextConfig} */
const BUILD_ID = `${Date.now()}`;

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
  async headers() {
    return [
      {
        source: '/app/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/signin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/homeseva-files/**',
      },
    ],
  },
};

export default nextConfig;


