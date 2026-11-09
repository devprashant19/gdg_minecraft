import type { Metadata, Viewport } from 'next';
import { Press_Start_2P } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pixel',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CraftHacks 2026 | Voxel Island Hackathon',
    template: '%s | CraftHacks 2026',
  },
  description:
    'An interactive voxel island hackathon adventure. Explore sponsor stations, view schedule and prize tracks, and register through the ancient portal.',
  openGraph: {
    title: 'CraftHacks 2026 | Voxel Island Hackathon',
    description: 'An interactive voxel island hackathon adventure.',
    url: siteUrl,
    siteName: 'CraftHacks 2026',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CraftHacks 2026 | Voxel Island Hackathon',
    description: 'An interactive voxel island hackathon adventure.',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffb46b',
  width: 'device-width',
  initialScale: 1,
  // user-scalable=no is explicitly omitted to ensure mobile accessibility
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${pixelFont.variable} h-full`}>
      <body className="min-h-full flex flex-col font-mono-pixel bg-[#181425] text-white">
        {/* Accessible Skip Link */}
        <a
          href="/2d"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-600 focus:text-white focus:rounded focus:border-2 focus:border-white font-pixel text-xs shadow-2xl"
        >
          Skip to 2D accessible version
        </a>
        {children}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src={process.env.NEXT_PUBLIC_UMAMI_SRC || 'https://cloud.umami.is/script.js'}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="lazyOnload"
          />
        )}
      </body>
    </html>
  );
}
