import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Departments' };

export default async function DepartmentsPage() {
  await requireRolePage('ADMIN');
  const departments = await prisma.department.findMany({
    select: {
      id: true, code: true, name: true, description: true,
      categories: { select: { name: true }, orderBy: { name: 'asc' } },
      _count: { select: { officers: { where: { active: true } }, complaints: true } },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1>Departments</h1>
        <p className="mt-1 text-slate-700">Each category has a default department. Routing rules can override it.</p>
      </div>
      {departments.length === 0 ? (
        <EmptyState title="No departments">Run the seed script to create the departments.</EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {departments.map((d) => (
            <li key={d.id}>
              <Card className="h-full">
                <p className="font-mono text-sm text-slate-600">{d.code}</p>
                <h2 className="mt-1">{d.name}</h2>
                <p className="mt-2 text-sm text-slate-700">{d.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-slate-600">Active officers</dt>
                    <dd className="text-lg font-bold">{d._count.officers}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Complaints</dt>
                    <dd className="text-lg font-bold">{d._count.complaints}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-sm text-slate-700">
                  <span className="text-slate-600">Default for: </span>
                  {d.categories.length > 0 ? d.categories.map((c) => c.name).join(', ') : 'no category'}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
