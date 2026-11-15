import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { OPEN_STATUSES } from '@/lib/ai/config';
import { Card, CardTitle } from '@/components/ui/card';
import { StaffComplaintView } from '@/components/complaints/StaffComplaintView';
import { ReassignForm } from '@/components/complaints/StaffForms';

export const metadata: Metadata = { title: 'Complaint' };

export default async function AdminComplaintPage({ params, searchParams }: { params: { id: string }; searchParams: { notice?: string } }) {
  const user = await requireRolePage('ADMIN');
  const [complaint, departments, officers] = await Promise.all([
    prisma.complaint.findUnique({ where: { id: params.id }, select: { departmentId: true } }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.officerProfile.findMany({
      where: { active: true, user: { active: true } },
      select: {
        id: true, departmentId: true, user: { select: { name: true } },
        _count: { select: { complaintsAssigned: { where: { status: { in: [...OPEN_STATUSES] } } } } },
      },
      orderBy: { employeeId: 'asc' },
    }),
  ]);

  return (
    <StaffComplaintView id={params.id} user={user} basePath="/admin/complaints" notice={searchParams.notice}>
      <Card>
        <CardTitle>Reassign (administrator)</CardTitle>
        <ReassignForm
          complaintId={params.id}
          currentDepartmentId={complaint?.departmentId ?? null}
          departments={departments}
          officers={officers.map((o) => ({ id: o.id, name: o.user.name, departmentId: o.departmentId, openCases: o._count.complaintsAssigned }))}
        />
      </Card>
    </StaffComplaintView>
  );
}
