import { Suspense } from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { OPEN_STATUSES } from '@/lib/ai/config';
import { isGeminiConfigured } from '@/lib/ai/gemini';
import { Alert } from '@/components/ui/alert';
import { STATUS_LABELS } from '@/components/ui/badges';
import { Card, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarList, StatGrid } from '@/components/ui/stat';

export const metadata: Metadata = { title: 'Admin dashboard' };

async function Counts() {
  const [total, open, resolved, triage, highRisk, withDuplicates] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: { in: [...OPEN_STATUSES] } } }),
    prisma.complaint.count({ where: { status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { needsManualTriage: true } }),
    prisma.complaint.count({ where: { fraudRiskLevel: 'HIGH' } }),
    prisma.complaint.count({ where: { matchesAsSource: { some: {} } } }),
  ]);
  return (
    <StatGrid
      items={[
        { label: 'All complaints', value: total, href: '/admin/complaints' },
        { label: 'Open', value: open },
        { label: 'Resolved', value: resolved, href: '/admin/complaints?status=RESOLVED' },
        { label: 'Need manual triage', value: triage, href: '/admin/complaints?triage=1' },
        { label: 'High risk', value: highRisk, href: '/admin/complaints?risk=HIGH' },
        { label: 'With possible duplicates', value: withDuplicates },
      ]}
    />
  );
}

async function ByDepartment() {
  const departments = await prisma.department.findMany({
    select: { name: true, _count: { select: { complaints: true } } },
    orderBy: { name: 'asc' },
  });
  return <BarList emptyText="No departments yet." rows={departments.map((d) => ({ label: d.name, value: d._count.complaints }))} />;
}

async function ByStatus() {
  const groups = await prisma.complaint.groupBy({ by: ['status'], _count: { _all: true } });
  return <BarList emptyText="No complaints yet." rows={groups.map((g) => ({ label: STATUS_LABELS[g.status], value: g._count._all })).sort((a, b) => b.value - a.value)} />;
}

async function ByClassifier() {
  const groups = await prisma.complaintAnalysis.groupBy({ by: ['provider'], _count: { _all: true } });
  const label = (p: string) => (p === 'gemini' ? 'Vision model' : 'Keyword rules (fallback)');
  return <BarList emptyText="No analyses yet." rows={groups.map((g) => ({ label: label(g.provider), value: g._count._all }))} />;
}

export default async function AdminDashboard() {
  await requireRolePage('ADMIN');
  return (
    <div className="space-y-8">
      <h1>Dashboard</h1>
      {!isGeminiConfigured() && (
        <Alert variant="info" title="Running on fallback keyword rules">
          No vision model key is configured, so photos are not analysed by a model. Categories come from keyword rules only.
        </Alert>
      )}
      <Suspense fallback={<Skeleton className="h-48" />}>
        <Counts />
      </Suspense>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>Complaints per department</CardTitle>
          <Suspense fallback={<Skeleton className="h-32" />}>
            <ByDepartment />
          </Suspense>
        </Card>
        <Card>
          <CardTitle>Complaints per status</CardTitle>
          <Suspense fallback={<Skeleton className="h-32" />}>
            <ByStatus />
          </Suspense>
        </Card>
        <Card>
          <CardTitle>Who categorised</CardTitle>
          <Suspense fallback={<Skeleton className="h-32" />}>
            <ByClassifier />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
