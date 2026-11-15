import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { OPEN_STATUSES } from '@/lib/ai/config';
import { buttonClass } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ComplaintList } from '@/components/complaints/ComplaintList';

export const metadata: Metadata = { title: 'My dashboard' };

// Each section below is its own async component inside <Suspense>.
// The heading is sent to the browser immediately; each section streams in when its query finishes.
async function Counts({ userId }: { userId: string }) {
  const [open, resolved, total] = await Promise.all([
    prisma.complaint.count({ where: { citizenId: userId, status: { in: [...OPEN_STATUSES] } } }),
    prisma.complaint.count({ where: { citizenId: userId, status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { citizenId: userId } }),
  ]);
  const items = [
    { label: 'Open', value: open },
    { label: 'Resolved', value: resolved },
    { label: 'Total submitted', value: total },
  ];
  return (
    <dl className="grid grid-cols-3 gap-3 sm:gap-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4">
          <dt className="text-sm text-slate-600">{item.label}</dt>
          <dd className="mt-1 text-2xl font-bold">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

async function RecentComplaints({ userId }: { userId: string }) {
  const complaints = await prisma.complaint.findMany({
    where: { citizenId: userId },
    select: { id: true, referenceNumber: true, title: true, status: true, priority: true, createdAt: true, category: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  if (complaints.length === 0) {
    return <EmptyState title="No complaints yet">When you report a problem it will appear here.</EmptyState>;
  }
  return <ComplaintList items={complaints} basePath="/citizen/complaints" />;
}

export default async function CitizenDashboard() {
  const user = await requireRolePage('CITIZEN');
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Hello, {user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-slate-700">Your complaints and their current status.</p>
        </div>
        <Link href="/citizen/submit" className={buttonClass('primary')}>
          Report a problem
        </Link>
      </div>

      <Suspense fallback={<Skeleton className="h-24" />}>
        <Counts userId={user.id} />
      </Suspense>

      <section aria-labelledby="recent">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent">Recent complaints</h2>
          <Link href="/citizen/complaints" className="link text-sm">
            View all
          </Link>
        </div>
        <Suspense fallback={<Skeleton className="h-48" />}>
          <RecentComplaints userId={user.id} />
        </Suspense>
      </section>
    </div>
  );
}
