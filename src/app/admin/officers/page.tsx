import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, ShieldCheck, UserCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOfficersPage() {
  const officers = await prisma.officerProfile.findMany({
    include: {
      user: true,
      department: true,
      complaintsAssigned: {
        select: { id: true, status: true },
      },
    },
    orderBy: { employeeId: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-900">Department Officers Directory</h1>
        <p className="text-xs text-slate-500 mt-1">
          Active field engineers, division inspectors, and departmental grievance officers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {officers.map((off) => {
          const totalAssigned = off.complaintsAssigned.length;
          const activeWorkload = off.complaintsAssigned.filter((c) =>
            ['ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(c.status)
          ).length;
          const resolvedCount = off.complaintsAssigned.filter((c) => c.status === 'RESOLVED').length;

          return (
            <Card key={off.id} className="border-slate-200">
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[11px] font-bold text-gov-900 bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                      {off.employeeId}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{off.user.name}</h3>
                    <p className="text-slate-500 text-[11px]">{off.designation || 'Field Officer'}</p>
                  </div>
                  <Badge variant={off.active ? 'success' : 'default'}>
                    {off.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Building2 className="h-3.5 w-3.5 text-gov-700" />
                    <span>{off.department.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="font-mono">{off.user.email}</span>
                  </div>
                  {off.user.phone && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{off.user.phone}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2 rounded bg-amber-50 border border-amber-200/60">
                    <span className="text-[10px] text-amber-700 block font-medium">Active Queue</span>
                    <span className="text-base font-bold text-amber-800 font-mono">{activeWorkload}</span>
                  </div>
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200/60">
                    <span className="text-[10px] text-emerald-700 block font-medium">Resolved</span>
                    <span className="text-base font-bold text-emerald-800 font-mono">{resolvedCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
