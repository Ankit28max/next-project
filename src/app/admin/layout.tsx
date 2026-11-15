import { requireRolePage } from '@/lib/auth/session';
import { AreaNav } from '@/components/layout/AreaNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRolePage('ADMIN');
  return (
    <>
      <AreaNav
        title="Administration"
        items={[
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/complaints', label: 'Complaints' },
          { href: '/admin/departments', label: 'Departments' },
          { href: '/admin/officers', label: 'Officers' },
          { href: '/admin/routing', label: 'Routing rules' },
          { href: '/admin/audit', label: 'Audit log' },
        ]}
      />
      <div className="page">{children}</div>
    </>
  );
}
