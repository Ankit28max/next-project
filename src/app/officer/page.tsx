import { Suspense } from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { complaintScope, type SessionUser } from '@/lib/auth/guards';
import { OPEN_STATUSES } from '@/lib/ai/config';
import { loadOfficerWorkloads } from '@/lib/ai/routing';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { BarList, StatGrid } from '@/components/ui/stat';
import { ComplaintList } from '@/components/complaints/ComplaintList';

export const metadata: Metadata = { title: 'Officer overview' };

const OPEN = { in: [...OPEN_STATUSES] };

async function Counts({ user }: { user: SessionUser }) {
  const scope = complaintScope(user);
  const [open, mine, highRisk, reopened] = await Promise.all([
    prisma.complaint.count({ where: { ...scope, status: OPEN } }),
    prisma.complaint.count({ where: { ...scope, status: OPEN, assignedOfficerId: user.officer?.id ?? '__none__' } }),
    prisma.complaint.count({ where: { ...scope, status: OPEN, fraudRiskLevel: 'HIGH' } }),
    prisma.complaint.count({ where: { ...scope, status: 'REOPENED' } }),
  ]);
  return (
    <StatGrid
      items={[
        { label: 'Open in department', value: open, href: '/officer/complaints' },
        { label: 'Assigned to me', value: mine, href: '/officer/complaints?mine=1' },
        { label: 'Open with high risk', value: highRisk, href: '/officer/complaints?risk=HIGH' },
        { label: 'Reopened by citizens', value: reopened, href: '/officer/complaints?status=REOPENED' },
      ]}
    />
  );
}

async function MyOpenCases({ user }: { user: SessionUser }) {
  const complaints = await prisma.complaint.findMany({
    where: { ...complaintScope(user), status: OPEN, assignedOfficerId: user.officer?.id ?? '__none__' },
    select: {
      id: true, referenceNumber: true, title: true, status: true, priority: true, createdAt: true,
      fraudRiskLevel: true, fraudRiskScore: true, needsManualTriage: true,
      category: { select: { name: true } },
      _count: { select: { matchesAsSource: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 8,
  });
  if (complaints.length === 0) return <EmptyState title="Nothing assigned to you">New complaints are assigned automatically.</EmptyState>;
  return <ComplaintList basePath="/officer/complaints" showRisk items={complaints.map(({ _count, ...c }) => ({ ...c, matchCount: _count.matchesAsSource }))} />;
}

async function Workload({ user }: { user: SessionUser }) {
  if (!user.officer) return null;
  const [loads, officers] = await Promise.all([
    loadOfficerWorkloads(prisma, user.officer.departmentId),
    prisma.officerProfile.findMany({ where: { departmentId: user.officer.departmentId }, select: { id: true, user: { select: { name: true } } } }),
  ]);
  const names = new Map(officers.map((o) => [o.id, o.user.name]));
  return <BarList emptyText="No active officers." rows={loads.map((l) => ({ label: names.get(l.id) ?? l.employeeId, value: l.openCases }))} />;
}

export default async function OfficerDashboard() {
  const user = await requireRolePage('OFFICER');
  return (
    <div className="space-y-8">
      <div>
        <h1>Overview</h1>
        <p className="mt-1 text-slate-700">{user.officer ? user.officer.departmentName : 'No department'}</p>
      </div>
      <Suspense fallback={<Skeleton className="h-24" />}>
        <Counts user={user} />
      </Suspense>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2" aria-labelledby="mine">
          <h2 id="mine" className="mb-3">
            My open cases (oldest first)
          </h2>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <MyOpenCases user={user} />
          </Suspense>
        </section>
        <Card>
          <CardTitle>Open cases per officer</CardTitle>
          <Suspense fallback={<Skeleton className="h-32" />}>
            <Workload user={user} />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
