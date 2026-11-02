import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FraudRiskBadge, PriorityBadge, StatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  CopyCheck,
  ExternalLink,
  Filter,
  Search,
  ShieldAlert,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: {
    status?: string;
    priority?: string;
    riskLevel?: string;
    search?: string;
    page?: string;
  };
}

export default async function OfficerComplaintsQueuePage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user) return null;

  const departmentId = user.officerProfile?.departmentId;
  const status = searchParams.status;
  const priority = searchParams.priority;
  const riskLevel = searchParams.riskLevel;
  const search = searchParams.search;
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 15;
  const skip = (page - 1) * limit;

  const where: any = departmentId ? { departmentId } : {};

  if (status && status !== 'ALL') where.status = status;
  if (priority && priority !== 'ALL') where.priority = priority;
  if (riskLevel && riskLevel !== 'ALL') where.fraudRiskLevel = riskLevel;

  if (search) {
    where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, complaints] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      include: {
        category: true,
        citizen: { select: { name: true, email: true, phone: true } },
        matchesAsSource: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-900">Department Complaints Queue ({total})</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review, inspect evidence, audit fraud risks, and execute resolution status updates.
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
                placeholder="Search reference or incident..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-700"
              />
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
              <select
                name="riskLevel"
                defaultValue={riskLevel || 'ALL'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk Only</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>

            <div>
              <Button type="submit" variant="secondary" size="sm" className="w-full text-xs">
                <Filter className="h-3.5 w-3.5 mr-1" /> Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Reference & Date</th>
                <th className="p-3.5">Title & Category</th>
                <th className="p-3.5">Citizen</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">AI Risk / Duplicates</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No complaints matching current filters.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-gov-900 block">
                        {c.referenceNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(c.createdAt)}
                      </span>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <span className="font-semibold text-slate-900 line-clamp-1 block">
                        {c.title}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {c.category?.name || 'General Civic'}
                      </span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className="text-slate-900 font-medium block">{c.citizen.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {c.citizen.phone || c.citizen.email}
                      </span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} />
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <FraudRiskBadge level={c.fraudRiskLevel} score={c.fraudRiskScore} />
                        {c.matchesAsSource.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <CopyCheck className="h-2.5 w-2.5" />
                            {c.matchesAsSource.length} potential duplicate(s)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <Link href={`/officer/complaints/${c.id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Inspect & Action <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {complaints.length} of {total} grievances
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={`/officer/complaints?page=${page - 1}&status=${status || 'ALL'}&riskLevel=${riskLevel || 'ALL'}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Previous
                  </Button>
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/officer/complaints?page=${page + 1}&status=${status || 'ALL'}&riskLevel=${riskLevel || 'ALL'}`}>
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
