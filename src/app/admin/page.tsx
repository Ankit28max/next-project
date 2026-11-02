import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  CopyCheck,
  FileText,
  PieChart,
  ShieldAlert,
  Users2,
  Workflow,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [
    totalCount,
    submittedCount,
    inProgressCount,
    resolvedCount,
    highFraudRiskCount,
    duplicateCount,
    deptStats,
    catStats,
    resolvedComplaints,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: 'SUBMITTED' } }),
    prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: { status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { fraudRiskLevel: 'HIGH' } }),
    prisma.complaintMatch.count(),
    prisma.department.findMany({
      include: {
        _count: { select: { complaints: true, officers: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.complaintCategory.findMany({
      include: {
        _count: { select: { complaints: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.complaint.findMany({
      where: { status: 'RESOLVED', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    }),
    prisma.auditLog.findMany({
      include: { actor: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  // Calculate Average Resolution Time in Hours
  let avgResolutionHours = 0;
  if (resolvedComplaints.length > 0) {
    const totalHours = resolvedComplaints.reduce((acc, curr) => {
      if (!curr.resolvedAt) return acc;
      const diffMs = new Date(curr.resolvedAt).getTime() - new Date(curr.createdAt).getTime();
      return acc + diffMs / (1000 * 60 * 60);
    }, 0);
    avgResolutionHours = Math.round((totalHours / resolvedComplaints.length) * 10) / 10;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            System Administration & Analytics Center
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            JanSetu Governance Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time database-backed performance analytics, fraud alert monitoring, and civic triage telemetry.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/complaints">
            <Button variant="primary" size="sm">
              <FileText className="h-4 w-4 mr-1.5" />
              Manage All Grievances
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-500 font-medium block">Total Grievances</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalCount}</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-500 font-medium block">New / Submitted</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">{submittedCount}</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-500 font-medium block">Active In Field</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{inProgressCount}</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-500 font-medium block">Resolved Total</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{resolvedCount}</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] text-slate-500 font-medium block">Avg Resolution</span>
            <span className="text-2xl font-bold text-gov-800 mt-1 block">
              {avgResolutionHours > 0 ? `${avgResolutionHours}h` : 'N/A'}
            </span>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/50 shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] text-rose-700 font-bold block">Fraud Alerts</span>
            <span className="text-2xl font-bold text-rose-700 mt-1 block">{highFraudRiskCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Department Workload & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload Card */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gov-700" />
              <span>Complaints by Department & Staff Capacity</span>
            </CardTitle>
            <Link href="/admin/departments" className="text-xs text-gov-700 hover:underline">
              Manage
            </Link>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {deptStats.map((dept) => {
              const count = dept._count.complaints;
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

              return (
                <div key={dept.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      {dept.name} ({dept.code})
                    </span>
                    <span className="text-slate-500 font-mono">
                      {count} cases ({pct}%) • {dept._count.officers} officers
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gov-700 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Complaints by Category Card */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-gov-700" />
              <span>Complaints by Civic Category</span>
            </CardTitle>
            <Link href="/admin/routing" className="text-xs text-gov-700 hover:underline">
              Routing Rules
            </Link>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {catStats.map((cat) => {
              const count = cat._count.complaints;
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.name}</span>
                    <span className="text-slate-500 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* System Audit Activity Strip */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-gov-700" />
            <span>Recent System Audit Activity</span>
          </CardTitle>
          <Link href="/admin/audit" className="text-xs text-gov-700 hover:underline">
            View All Audit Logs
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 text-xs">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-900 block font-mono">
                    {log.action}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Actor: {log.actor?.name || 'System Auto-Engine'} ({log.actor?.role || 'SYSTEM'}) • Entity: {log.entityType}
                  </span>
                </div>
                <time className="text-[11px] text-slate-400 font-mono flex-shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </time>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
