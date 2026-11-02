import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityBadge, StatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FilePlus2,
  FileText,
  Landmark,
  ListFilter,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CitizenDashboard() {
  const user = await getSessionUser();
  if (!user) return null;

  const [totalCount, activeCount, resolvedCount, recentComplaints] = await Promise.all([
    prisma.complaint.count({ where: { citizenId: user.id } }),
    prisma.complaint.count({
      where: {
        citizenId: user.id,
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'] },
      },
    }),
    prisma.complaint.count({
      where: { citizenId: user.id, status: 'RESOLVED' },
    }),
    prisma.complaint.findMany({
      where: { citizenId: user.id },
      include: {
        category: true,
        department: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-gov-700 uppercase tracking-wider block mb-1">
            Citizen Grievance Workspace
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track submitted civic grievances, monitor department status, and submit new reports.
          </p>
        </div>

        <Link href="/citizen/submit">
          <Button variant="primary" className="shadow-sm">
            <FilePlus2 className="h-4 w-4 mr-1.5" />
            File New Grievance
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Submitted</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Active / In Progress</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{activeCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Resolved Grievances</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{resolvedCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Grievances List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-gov-800" />
            <h2 className="text-lg font-bold text-slate-900">Recent Grievances</h2>
          </div>
          {totalCount > 5 && (
            <Link
              href="/citizen/complaints"
              className="text-xs font-semibold text-gov-700 hover:text-gov-900 flex items-center gap-1"
            >
              View all ({totalCount}) <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {recentComplaints.length === 0 ? (
          <Card className="border-slate-200 p-8 text-center bg-white">
            <FileText className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No grievances filed yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Notice a damaged road, broken streetlight, or burst water pipeline in your area? Submit a grievance with photo evidence and location.
            </p>
            <div className="mt-4">
              <Link href="/citizen/submit">
                <Button variant="primary" size="sm">
                  <FilePlus2 className="h-4 w-4 mr-1.5" /> File First Grievance
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {recentComplaints.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-gov-400 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
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

                <div className="flex-shrink-0 w-full sm:w-auto flex justify-end">
                  <Link href={`/citizen/complaints/${c.id}`} className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs">
                      Live Tracking <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
