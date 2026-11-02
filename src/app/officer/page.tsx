import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FraudRiskBadge, PriorityBadge, StatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  CopyCheck,
  FileText,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OfficerDashboard() {
  const user = await getSessionUser();
  if (!user) return null;

  const departmentId = user.officerProfile?.departmentId;
  const departmentName = user.officerProfile?.department?.name || 'Assigned Department';

  const whereDept = departmentId ? { departmentId } : {};

  const [
    totalAssigned,
    pendingReview,
    inProgress,
    resolved,
    highFraudRiskCount,
    duplicatesCount,
    urgentComplaints,
    suspiciousComplaints,
  ] = await Promise.all([
    prisma.complaint.count({ where: whereDept }),
    prisma.complaint.count({ where: { ...whereDept, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED'] } } }),
    prisma.complaint.count({ where: { ...whereDept, status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: { ...whereDept, status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { ...whereDept, fraudRiskLevel: 'HIGH' } }),
    prisma.complaintMatch.count({
      where: departmentId ? { complaint: { departmentId } } : undefined,
    }),
    prisma.complaint.findMany({
      where: {
        ...whereDept,
        priority: { in: ['HIGH', 'URGENT'] },
        status: { notIn: ['RESOLVED', 'REJECTED'] },
      },
      include: { category: true, citizen: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
    prisma.complaint.findMany({
      where: {
        ...whereDept,
        fraudRiskLevel: { in: ['HIGH', 'MEDIUM'] },
        status: { notIn: ['RESOLVED', 'REJECTED'] },
      },
      include: { category: true, citizen: true },
      orderBy: { fraudRiskScore: 'desc' },
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Officer Department Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gov-800 uppercase tracking-wider bg-gov-50 px-2 py-0.5 rounded border border-gov-200">
              Department Operations Center
            </span>
            <span className="text-xs font-mono text-slate-500">
              Badge: {user.officerProfile?.employeeId || 'OFF-ADMIN'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-gov-800" />
            <span>{departmentName}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Officer In-Charge: <strong>{user.name}</strong> • Active Redressal & Field Verification Queue
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/officer/complaints">
            <Button variant="primary" size="sm">
              <Briefcase className="h-4 w-4 mr-1.5" />
              Open Complaint Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Pending Review</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingReview}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">In Field Progress</p>
              <p className="text-2xl font-bold text-gov-800 mt-1">{inProgress}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gov-100 text-gov-800">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Potential Duplicates</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{duplicatesCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <CopyCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Suspicious Risk Flags</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{highFraudRiskCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Urgent Triage Queue & Suspicious AI Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Triage Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>High Priority Grievances Requiring Action</span>
            </h2>
            <Link
              href="/officer/complaints?priority=HIGH"
              className="text-xs text-gov-700 font-medium hover:underline flex items-center"
            >
              View Queue <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>

          {urgentComplaints.length === 0 ? (
            <Card className="p-6 text-center text-xs text-slate-500">
              No urgent grievances pending in your queue.
            </Card>
          ) : (
            <div className="space-y-3">
              {urgentComplaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2 hover:border-gov-400 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-gov-900 bg-gov-50 px-2 py-0.5 rounded">
                      {c.referenceNumber}
                    </span>
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{c.title}</h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Citizen: {c.citizen.name}</span>
                    <Link
                      href={`/officer/complaints/${c.id}`}
                      className="text-xs font-semibold text-gov-800 hover:underline flex items-center gap-1"
                    >
                      Inspect & Action <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suspicious Complaints AI Review Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>Suspicious Complaint & AI Risk Review Queue</span>
            </h2>
            <Link
              href="/officer/complaints?riskLevel=HIGH"
              className="text-xs text-gov-700 font-medium hover:underline flex items-center"
            >
              View All Flags <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>

          {suspiciousComplaints.length === 0 ? (
            <Card className="p-6 text-center text-xs text-slate-500">
              No suspicious complaints flagged for your department.
            </Card>
          ) : (
            <div className="space-y-3">
              {suspiciousComplaints.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-rose-200/80 rounded-xl p-4 shadow-xs space-y-2 hover:border-rose-400 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-gov-900 bg-gov-50 px-2 py-0.5 rounded">
                      {c.referenceNumber}
                    </span>
                    <FraudRiskBadge level={c.fraudRiskLevel} score={c.fraudRiskScore} />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{c.title}</h3>
                  <p className="text-[11px] text-slate-600 line-clamp-1">
                    {c.aiExplanation || 'Requires manual evidence verification.'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Citizen: {c.citizen.name}</span>
                    <Link
                      href={`/officer/complaints/${c.id}`}
                      className="text-xs font-semibold text-rose-700 hover:underline flex items-center gap-1"
                    >
                      Audit Submission <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
