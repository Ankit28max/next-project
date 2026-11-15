import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { AreaNav } from '@/components/layout/AreaNav';
import { Alert } from '@/components/ui/alert';

export default async function OfficerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRolePage('OFFICER');
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  return (
    <>
      <AreaNav
        title={user.officer?.departmentName ?? 'Officer'}
        items={[
          { href: '/officer', label: 'Overview' },
          { href: '/officer/complaints', label: 'Complaint queue' },
          { href: '/officer/notifications', label: 'Notifications', badge: unread },
        ]}
      />
      <div className="page">
        {!user.officer && (
          <Alert variant="warning" title="No active department" className="mb-6">
            Your officer profile is not active, so no complaints are visible. Please contact an administrator.
          </Alert>
        )}
        {children}
      </div>
    </>
  );
}
