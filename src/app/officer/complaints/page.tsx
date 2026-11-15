import type { Metadata } from 'next';
import { requireRolePage } from '@/lib/auth/session';
import { complaintScope } from '@/lib/auth/guards';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { ComplaintList } from '@/components/complaints/ComplaintList';
import { StaffFilterForm } from '@/components/complaints/StaffFilterForm';
import { STAFF_PAGE_SIZE, loadStaffList, staffFilterSchema } from '@/components/complaints/staff-list';

export const metadata: Metadata = { title: 'Complaint queue' };

export default async function OfficerQueuePage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const user = await requireRolePage('OFFICER');
  const filters = staffFilterSchema.parse(searchParams);
  // complaintScope() limits the query to the officer's own department. The filters only narrow it further.
  const scope = { ...complaintScope(user), ...(filters.mine ? { assignedOfficerId: user.officer?.id ?? '__none__' } : {}) };
  const { total, items } = await loadStaffList(scope, filters);

  return (
    <div className="space-y-6">
      <h1>Complaint queue</h1>
      <StaffFilterForm filters={filters} basePath="/officer/complaints" showMine />
      {items.length === 0 ? (
        <EmptyState title="No complaints match">Try clearing the filters.</EmptyState>
      ) : (
        <>
          <ComplaintList items={items.map(({ department, ...rest }) => rest)} basePath="/officer/complaints" showRisk />
          <Pagination page={filters.page} pageSize={STAFF_PAGE_SIZE} total={total} basePath="/officer/complaints" params={{ status: filters.status, risk: filters.risk, q: filters.q, mine: filters.mine }} />
        </>
      )}
    </div>
  );
}
