import type { Metadata } from 'next';
import Link from 'next/link';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { buttonClass } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { ComplaintList } from '@/components/complaints/ComplaintList';

export const metadata: Metadata = { title: 'My complaints' };

const PAGE_SIZE = 10;
const pageSchema = z.coerce.number().int().min(1).max(10_000).catch(1);

export default async function MyComplaintsPage({ searchParams }: { searchParams: { page?: string } }) {
  const user = await requireRolePage('CITIZEN');
  const page = pageSchema.parse(searchParams.page);
  const where = { citizenId: user.id };

  const [total, complaints] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      select: { id: true, referenceNumber: true, title: true, status: true, priority: true, createdAt: true, category: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1>My complaints</h1>
        <Link href="/citizen/submit" className={buttonClass('primary')}>
          Report a problem
        </Link>
      </div>
      {complaints.length === 0 ? (
        <EmptyState title="No complaints yet">When you report a problem it will appear here.</EmptyState>
      ) : (
        <>
          <ComplaintList items={complaints} basePath="/citizen/complaints" />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/citizen/complaints" params={{}} />
        </>
      )}
    </div>
  );
}
