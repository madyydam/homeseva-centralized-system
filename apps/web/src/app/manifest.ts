import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HomeSeva Enterprise ERP',
    short_name: 'HomeSeva ERP',
    description: 'Centralized Multi-Enterprise ERP & Operations Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#2563eb',
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['business', 'productivity', 'utilities'],
  };
}
