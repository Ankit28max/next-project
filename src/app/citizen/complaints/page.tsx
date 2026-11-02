import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityBadge, StatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  ArrowRight,
  FilePlus2,
  FileText,
  Filter,
  MapPin,
  Search,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: {
    status?: string;
    search?: string;
    page?: string;
  };
}

export default async function CitizenComplaintsPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user) return null;

  const status = searchParams.status;
  const search = searchParams.search;
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: any = { citizenId: user.id };

  if (status && status !== 'ALL') {
    where.status = status;
  }

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
        department: true,
        images: { take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gov-900">My Grievances ({total})</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse all civic issues submitted under your citizen profile.
          </p>
        </div>

        <Link href="/citizen/submit">
          <Button variant="primary" size="sm">
            <FilePlus2 className="h-4 w-4 mr-1.5" /> File New Grievance
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4">
          <form method="GET" className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="search"
                defaultValue={search || ''}
                placeholder="Search by Reference Number (GRV-...) or Keyword"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                name="status"
                defaultValue={status || 'ALL'}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-gov-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
                <option value="REOPENED">Reopened</option>
              </select>

              <Button type="submit" variant="secondary" size="sm" className="text-xs">
                <Filter className="h-3.5 w-3.5 mr-1" /> Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Grievances List */}
      {complaints.length === 0 ? (
        <Card className="border-slate-200 p-8 text-center bg-white">
          <FileText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No complaints found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {search || status ? 'Try clearing your search filters.' : 'You have not submitted any complaints yet.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3.5">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-gov-400 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 flex-1">
                {c.images.length > 0 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.images[0].storageUrl}
                    alt="Thumbnail"
                    className="h-16 w-16 rounded-lg object-cover border border-slate-200 flex-shrink-0 hidden sm:block"
                  />
                )}

                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gov-900 bg-gov-50 px-2.5 py-0.5 rounded border border-gov-200">
                      {c.referenceNumber}
                    </span>
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    <span className="text-xs text-slate-400 font-mono">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {c.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[280px] sm:max-w-md">{c.address}</span>
                    </span>
                    {c.department && (
                      <span className="text-gov-700 font-medium">
                        Dept: {c.department.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 w-full md:w-auto flex justify-end">
                <Link href={`/citizen/complaints/${c.id}`} className="w-full md:w-auto">
                  <Button variant="outline" size="sm" className="w-full md:w-auto text-xs">
                    Live Tracking <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/citizen/complaints?page=${page - 1}&status=${status || 'ALL'}&search=${search || ''}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      Previous
                    </Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/citizen/complaints?page=${page + 1}&status=${status || 'ALL'}&search=${search || ''}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
