import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Users, Workflow } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDepartmentsPage() {
  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: {
          officers: true,
          complaints: true,
          categories: true,
        },
      },
      officers: {
        include: { user: { select: { name: true } } },
        take: 3,
      },
    },
    orderBy: { code: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gov-900">Departments Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure municipal departments, jurisdiction boundaries, and staff capacity.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {departments.map((dept) => (
          <Card key={dept.id} className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-gov-900 bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
                  {dept.code}
                </span>
                <CardTitle className="text-sm font-bold text-slate-900">{dept.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">{dept.description}</p>

              {dept.jurisdiction && (
                <div className="p-2 rounded bg-slate-50 text-[11px] text-slate-500">
                  <strong>Jurisdiction:</strong> {dept.jurisdiction}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-gov-700" />
                  <span>
                    <strong>{dept._count.officers}</strong> Active Officers
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Workflow className="h-3.5 w-3.5 text-blue-600" />
                  <span>
                    <strong>{dept._count.complaints}</strong> Handled Complaints
                  </span>
                </div>
              </div>

              {dept.officers.length > 0 && (
                <div className="pt-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Staff: </span>
                  {dept.officers.map((o) => o.user.name).join(', ')}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
