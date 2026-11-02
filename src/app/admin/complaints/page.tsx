import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FraudRiskBadge, PriorityBadge, StatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { ExternalLink, Filter, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: {
    departmentId?: string;
    status?: string;
    riskLevel?: string;
    search?: string;
    page?: string;
  };
}

export default async function AdminComplaintsPage({ searchParams }: Props) {
  const departmentId = searchParams.departmentId;
  const status = searchParams.status;
  const riskLevel = searchParams.riskLevel;
  const search = searchParams.search;
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (departmentId && departmentId !== 'ALL') where.departmentId = departmentId;
  if (status && status !== 'ALL') where.status = status;
  if (riskLevel && riskLevel !== 'ALL') where.fraudRiskLevel = riskLevel;

  if (search) {
    where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, complaints, departments] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      include: {
        department: true,
        category: true,
        citizen: { select: { name: true, email: true } },
        assignedOfficer: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.department.findMany({ select: { id: true, code: true, name: true } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-900">All Grievances Directory ({total})</h1>
        <p className="text-xs text-slate-500 mt-1">
          Full system oversight across all municipal departments and jurisdictions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="search"
                defaultValue={search || ''}
                placeholder="Search reference, title, or address..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-700"
              />
            </div>

            <div>
              <select
                name="departmentId"
                defaultValue={departmentId || 'ALL'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                name="status"
                defaultValue={status || 'ALL'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <Button type="submit" variant="secondary" size="sm" className="w-full text-xs">
                <Filter className="h-3.5 w-3.5 mr-1" /> Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Reference & Date</th>
                <th className="p-3.5">Incident Title</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Assigned Officer</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Fraud Risk</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-mono font-bold text-gov-900 block">{c.referenceNumber}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{formatDate(c.createdAt)}</span>
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <span className="font-semibold text-slate-900 block truncate">{c.title}</span>
                    <span className="text-[11px] text-slate-500">Citizen: {c.citizen.name}</span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-medium text-slate-800">{c.department?.name || 'Unassigned'}</span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="text-slate-700">{c.assignedOfficer?.user.name || 'Unassigned'}</span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <FraudRiskBadge level={c.fraudRiskLevel} score={c.fraudRiskScore} />
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <Link href={`/officer/complaints/${c.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        Audit / Action <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/admin/complaints?page=${page - 1}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Previous
                  </Button>
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/complaints?page=${page + 1}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Next
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
