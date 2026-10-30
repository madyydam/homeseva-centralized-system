import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HomeSeva — Centralized ERP v1.2',
  description: 'Single centralized ERP for company group management, strict role-based access, and per-business workspaces.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#050609] text-white font-sans antialiased overflow-x-hidden selection:bg-amber-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
