import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { OfficerNav } from '@/components/layout/OfficerNav';

export default async function OfficerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  // Officer workspace accessible by OFFICER and ADMIN roles
  if (user.role !== 'OFFICER' && user.role !== 'ADMIN') {
    redirect('/citizen');
  }

  return (
    <div className="min-h-screen bg-slate-100/70">
      <OfficerNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
    </div>
  );
}
