import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { NotificationList } from '@/components/complaints/NotificationList';

export const metadata: Metadata = { title: 'Notifications' };

export default async function CitizenNotificationsPage() {
  const user = await requireRolePage('CITIZEN');
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    select: { id: true, title: true, message: true, readAt: true, createdAt: true, complaintId: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return (
    <div className="space-y-6">
      <h1>Notifications</h1>
      <NotificationList notifications={notifications} complaintBasePath="/citizen/complaints" />
      <p className="text-sm text-slate-600">
        Looking for a complaint? See{' '}
        <Link href="/citizen/complaints" className="link">
          My complaints
        </Link>
        .
      </p>
    </div>
  );
}
