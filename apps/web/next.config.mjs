/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: false,
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
  webpack: (config, { isServer, dev }) => {
    if (isServer && dev) {
      config.output.chunkFilename = 'chunks/[name].js';
    }
    return config;
  },
};

export default nextConfig;
