import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { AreaNav } from '@/components/layout/AreaNav';

// Reads the session cookie, so everything under /citizen is rendered per request (dynamic rendering).
export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRolePage('CITIZEN');
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <>
      <AreaNav
        title="Citizen"
        items={[
          { href: '/citizen', label: 'Overview' },
          { href: '/citizen/submit', label: 'Report a problem' },
          { href: '/citizen/complaints', label: 'My complaints' },
          { href: '/citizen/notifications', label: 'Notifications', badge: unread },
        ]}
      />
      <div className="page">{children}</div>
    </>
  );
}
