import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { CitizenNav } from '@/components/layout/CitizenNav';

export default async function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CitizenNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
    </div>
  );
}
