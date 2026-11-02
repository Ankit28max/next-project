import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Users2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      officerProfile: { include: { department: true } },
      _count: { select: { complaintsSubmitted: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-900">User Directory ({users.length})</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete register of citizen accounts, department officers, and system administrators.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Name & Email</th>
                <th className="p-3.5">System Role</th>
                <th className="p-3.5">Department / Profile</th>
                <th className="p-3.5">Grievances Filed</th>
                <th className="p-3.5">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900 block">{u.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <Badge
                      variant={
                        u.role === 'ADMIN'
                          ? 'danger'
                          : u.role === 'OFFICER'
                          ? 'info'
                          : 'secondary'
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>

                  <td className="p-3.5">
                    {u.officerProfile ? (
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          {u.officerProfile.department.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {u.officerProfile.employeeId}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Citizen Profile</span>
                    )}
                  </td>

                  <td className="p-3.5 whitespace-nowrap font-mono font-semibold text-slate-700">
                    {u._count.complaintsSubmitted}
                  </td>

                  <td className="p-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
