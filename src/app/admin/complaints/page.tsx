import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { ComplaintList } from '@/components/complaints/ComplaintList';
import { StaffFilterForm } from '@/components/complaints/StaffFilterForm';
import { STAFF_PAGE_SIZE, loadStaffList, staffFilterSchema } from '@/components/complaints/staff-list';

export const metadata: Metadata = { title: 'All complaints' };

export default async function AdminComplaintsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  await requireRolePage('ADMIN');
  const filters = staffFilterSchema.parse(searchParams);
  const [departments, { total, items }] = await Promise.all([
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    loadStaffList(filters.department ? { departmentId: filters.department } : {}, filters),
  ]);

  return (
    <div className="space-y-6">
      <h1>All complaints</h1>
      <StaffFilterForm filters={filters} basePath="/admin/complaints" departments={departments} />
      {items.length === 0 ? (
        <EmptyState title="No complaints match">Try clearing the filters.</EmptyState>
      ) : (
        <>
          <ComplaintList items={items} basePath="/admin/complaints" showRisk />
          <Pagination
            page={filters.page}
            pageSize={STAFF_PAGE_SIZE}
            total={total}
            basePath="/admin/complaints"
            params={{ status: filters.status, risk: filters.risk, q: filters.q, triage: filters.triage, department: filters.department }}
          />
        </>
      )}
    </div>
  );
}
