import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Building2, CheckCircle2, Clock, UserCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OfficerWorkloadPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const departmentId = user.officerProfile?.departmentId;
  const department = departmentId
    ? await prisma.department.findUnique({
        where: { id: departmentId },
        include: {
          officers: {
            include: {
              user: true,
              complaintsAssigned: {
                select: { id: true, status: true, priority: true },
              },
            },
          },
        },
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-900">Department Workload Distribution</h1>
        <p className="text-xs text-slate-500 mt-1">
          {department?.name || 'Department'} • Active ticket allocation and field balance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {department?.officers.map((officer) => {
          const totalAssigned = officer.complaintsAssigned.length;
          const activeCases = officer.complaintsAssigned.filter((c) =>
            ['ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(c.status)
          ).length;
          const resolvedCases = officer.complaintsAssigned.filter(
            (c) => c.status === 'RESOLVED'
          ).length;

          return (
            <Card key={officer.id} className="border-slate-200">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      {officer.user.name}
                    </CardTitle>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {officer.employeeId} • {officer.designation || 'Field Officer'}
                    </p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gov-50 text-gov-800">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Active Workload:</span>
                  <span className="font-bold text-amber-600 font-mono text-sm">
                    {activeCases} cases
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Resolved Cases:</span>
                  <span className="font-bold text-emerald-600 font-mono text-sm">
                    {resolvedCases} cases
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Total Lifetime:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {totalAssigned} cases
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
