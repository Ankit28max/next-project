import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getSessionUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'JanSetu - Smart Grievance Redressal & Fake Complaint Detection System',
  description:
    'Civic grievance portal featuring multimodal AI categorization, geographic duplicate detection, and fake complaint risk assessment for municipal governance.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen antialiased bg-slate-50 text-slate-900 selection:bg-gov-900 selection:text-white">
        <Navbar user={user} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
