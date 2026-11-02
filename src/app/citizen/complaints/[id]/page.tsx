import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityBadge, StatusBadge } from '@/components/ui/badge';
import { StatusTimeline } from '@/components/complaints/StatusTimeline';
import { formatDate } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  RefreshCw,
  Sparkles,
  User,
} from 'lucide-react';

const LeafletComplaintMap = dynamic(
  () => import('@/components/maps/LeafletComplaintMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 w-full rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
        Loading Map...
      </div>
    ),
  }
);

interface Props {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export default async function ComplaintDetailPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      department: true,
      assignedOfficer: {
        include: {
          user: { select: { name: true } },
          department: true,
        },
      },
      images: true,
      statusHistory: {
        where: { isInternal: false }, // Citizens do NOT see internal staff notes
        include: {
          actor: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!complaint) notFound();

  // Scoping: Citizens can only see their own complaints
  if (user.role === 'CITIZEN' && complaint.citizenId !== user.id) {
    redirect('/citizen');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Link href="/citizen/complaints">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to My Grievances
          </Button>
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          Incident ID: {complaint.id}
        </span>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-extrabold text-gov-900 bg-gov-50 px-3 py-1 rounded-lg border border-gov-300">
              {complaint.referenceNumber}
            </span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Calendar className="h-3.5 w-3.5" />
            <span>Filed: {formatDate(complaint.createdAt)}</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          {complaint.title}
        </h1>

        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
          {complaint.description}
        </p>
      </div>

      {/* Resolution Summary (If Resolved) */}
      {complaint.status === 'RESOLVED' && complaint.resolutionSummary && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Official Resolution Report</span>
          </div>
          <p className="text-xs text-emerald-950 leading-relaxed">
            {complaint.resolutionSummary}
          </p>
          {complaint.resolvedAt && (
            <p className="text-[11px] text-emerald-700 font-mono">
              Resolved on: {formatDate(complaint.resolvedAt)}
            </p>
          )}

          {/* Reopen Action Form */}
          <div className="pt-3 border-t border-emerald-200/80 flex items-center justify-between">
            <span className="text-xs text-emerald-800">
              Issue still not fixed? You may reopen this grievance for re-inspection.
            </span>
            <form action={`/api/complaints/${complaint.id}/status`} method="POST">
              <input type="hidden" name="status" value="REOPENED" />
              <Button type="button" variant="outline" size="sm" className="text-xs bg-white">
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reopen Grievance
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Grid: Left Column (Status Timeline) & Right Column (Meta & Map) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Timeline */}
        <div className="md:col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-gov-700" />
                <span>Live Redressal Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline
                history={complaint.statusHistory as any}
                currentStatus={complaint.status}
              />
            </CardContent>
          </Card>

          {/* Evidence Photos */}
          {complaint.images.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">Submitted Photo Evidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {complaint.images.map((img) => (
                    <div
                      key={img.id}
                      className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.storageUrl}
                        alt="Evidence"
                        className="h-48 w-full object-cover"
                      />
                      <div className="p-2 text-xs text-slate-600 truncate">
                        {img.fileName}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Metadata Column */}
        <div className="space-y-4">
          {/* Department & Officer Details */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Assigned Governance Unit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-medium block">Department:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-gov-700" />
                  {complaint.department?.name || 'Under Automated Triage'}
                </span>
              </div>

              {complaint.category && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-medium block">Category:</span>
                  <span className="font-semibold text-slate-800">
                    {complaint.category.name}
                  </span>
                </div>
              )}

              {complaint.assignedOfficer && (
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-medium block">Assigned Officer:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-gov-700" />
                    {complaint.assignedOfficer.user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    ID: {complaint.assignedOfficer.employeeId}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incident Location & Map */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gov-700" />
                <span>Incident Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-600 leading-snug">
                {complaint.address}
              </p>

              {complaint.latitude && complaint.longitude && (
                <LeafletComplaintMap
                  latitude={complaint.latitude}
                  longitude={complaint.longitude}
                  title={complaint.title}
                  address={complaint.address}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
