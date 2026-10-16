import type { Metadata, Viewport } from 'next';
import { Barlow_Condensed, Inter } from 'next/font/google';
import { Suspense } from 'react';
import { Providers, themeScript } from '@/components/Providers';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const barlow = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-barlow', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Paddock Stats', template: '%s · Paddock Stats' },
  description: 'Explore Formula 1 championship fights, head-to-heads and circuit history since 2014.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f5f1' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0f12' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${barlow.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <Providers>
          <a href="#main" className="sr-only-focusable fixed left-4 top-3 z-50 rounded-md bg-ink px-3 py-2 text-sm text-bg">
            Skip to content
          </a>
          <Suspense fallback={<div className="h-16 border-b border-line" />}>
            <SiteHeader />
          </Suspense>
          <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
