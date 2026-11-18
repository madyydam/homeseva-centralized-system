import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegistrar } from '@/components/PwaRegistrar';

export const metadata: Metadata = {
  title: 'HomeSeva — Centralized ERP v1.6',
  description: 'Single centralized ERP for company group management, strict role-based access, and per-business workspaces.',
  manifest: '/manifest.json',
  applicationName: 'HomeSeva ERP',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HomeSeva ERP',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-[#050609] text-white font-sans antialiased overflow-x-hidden selection:bg-amber-500 selection:text-white">
        {children}
        <PwaRegistrar />
      </body>
    </html>
  );
}
