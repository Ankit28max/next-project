import type { Metadata } from 'next';
import { CheckCircle2, XCircle } from 'lucide-react';
import { setOfficerActiveAction } from '@/actions/admin';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { OPEN_STATUSES } from '@/lib/ai/config';
import { Notice } from '@/components/ui/notice';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SubmitButton } from '@/components/ui/submit-button';
import { CreateOfficerForm } from './CreateOfficerForm';

export const metadata: Metadata = { title: 'Officers' };

export default async function OfficersPage({ searchParams }: { searchParams: { notice?: string } }) {
  await requireRolePage('ADMIN');
  const [officers, departments] = await Promise.all([
    prisma.officerProfile.findMany({
      select: {
        id: true, employeeId: true, designation: true, active: true,
        user: { select: { name: true, email: true } },
        department: { select: { name: true } },
        _count: { select: { complaintsAssigned: { where: { status: { in: [...OPEN_STATUSES] } } } } },
      },
      orderBy: [{ active: 'desc' }, { employeeId: 'asc' }],
    }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <h1>Officers</h1>
      <Notice code={searchParams.notice} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {officers.length === 0 ? (
            <EmptyState title="No officers yet">Create the first officer account with the form.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {officers.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{o.user.name}</p>
                    <p className="break-all text-sm text-slate-600">
                      {o.employeeId} · {o.department.name}
                      {o.designation && ` · ${o.designation}`} · {o.user.email}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                      {o.active ? (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
                          <CheckCircle2 className="h-4 w-4" aria-hidden /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-red-800">
                          <XCircle className="h-4 w-4" aria-hidden /> Deactivated
                        </span>
                      )}
                      <span className="text-slate-700">{o._count.complaintsAssigned} open cases</span>
                    </p>
                  </div>
                  <form action={setOfficerActiveAction}>
                    <input type="hidden" name="officerId" value={o.id} />
                    <input type="hidden" name="active" value={o.active ? 'false' : 'true'} />
                    <SubmitButton variant={o.active ? 'danger' : 'secondary'}>{o.active ? 'Deactivate' : 'Reactivate'}</SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Card>
          <CardTitle>Create officer</CardTitle>
          <CreateOfficerForm departments={departments} />
        </Card>
      </div>
    </div>
  );
}
