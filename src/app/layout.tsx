import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

// next/font downloads the font at build time and serves it from our own domain.
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'JanSetu: civic grievance portal', template: '%s | JanSetu' },
  description:
    'Report a civic problem with a photo and location. JanSetu suggests a category, flags possible duplicates and routes the complaint to a department for a human officer to review.',
};

export const viewport: Viewport = { themeColor: '#234985' };

// The root layout reads no cookies, so static pages (About, How it works, Privacy) stay static.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
