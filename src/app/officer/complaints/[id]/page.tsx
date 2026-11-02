import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FraudRiskBadge, PriorityBadge, StatusBadge } from '@/components/ui/badge';
import { StatusTimeline } from '@/components/complaints/StatusTimeline';
import { DuplicateMatchCard } from '@/components/complaints/DuplicateMatchCard';
import { FraudRiskMeter } from '@/components/complaints/FraudRiskMeter';
import { OfficerActionConsole } from '@/components/complaints/OfficerActionConsole';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  BrainCircuit,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  ShieldAlert,
  Sparkles,
  User,
} from 'lucide-react';

const LeafletComplaintMap = dynamic(
  () => import('@/components/maps/LeafletComplaintMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 w-full rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
        Loading Incident Map...
      </div>
    ),
  }
);

interface Props {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export default async function OfficerComplaintReviewPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
    include: {
      citizen: true,
      category: true,
      department: true,
      assignedOfficer: {
        include: { user: true },
      },
      images: true,
      statusHistory: {
        include: { actor: true },
        orderBy: { createdAt: 'asc' },
      },
      analyses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      matchesAsSource: {
        include: {
          matchedComplaint: {
            select: {
              id: true,
              referenceNumber: true,
              title: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!complaint) notFound();

  // Scoping check for officer: must belong to the department
  if (
    user.role === 'OFFICER' &&
    user.officerProfile?.departmentId &&
    complaint.departmentId &&
    complaint.departmentId !== user.officerProfile.departmentId
  ) {
    redirect('/officer');
  }

  const analysis = complaint.analyses[0] || null;
  const analysisRaw = (analysis?.rawResult as any) || null;
  const flagReasons = analysisRaw?.fraudAssessment?.flagReasons || [];
  const recommendedAction = analysisRaw?.fraudAssessment?.recommendedAction || null;

  // Format matches for DuplicateMatchCard
  const formattedMatches = complaint.matchesAsSource.map((m) => ({
    matchedComplaintId: m.matchedComplaintId,
    referenceNumber: m.matchedComplaint.referenceNumber,
    title: m.matchedComplaint.title,
    combinedScore: m.combinedScore,
    textSimilarity: m.textSimilarity,
    imageSimilarity: m.imageSimilarity,
    geographicDistanceKm: m.geographicDistance,
    matchReason: m.matchReason,
    createdAt: m.matchedComplaint.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link href="/officer/complaints">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Queue
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">
            Internal Case ID: {complaint.id}
          </span>
        </div>
      </div>

      {/* Primary Case Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-extrabold text-gov-900 bg-gov-50 px-3 py-1 rounded-lg border border-gov-300">
              {complaint.referenceNumber}
            </span>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <FraudRiskBadge level={complaint.fraudRiskLevel} score={complaint.fraudRiskScore} />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Calendar className="h-3.5 w-3.5" />
            <span>Submitted: {formatDate(complaint.createdAt)}</span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          {complaint.title}
        </h1>

        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
          {complaint.description}
        </p>

        {/* Citizen Information Strip */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-gov-700" />
            <strong>Citizen:</strong> {complaint.citizen.name}
          </span>
          <span>
            <strong>Email:</strong> {complaint.citizen.email}
          </span>
          {complaint.citizen.phone && (
            <span>
              <strong>Phone:</strong> {complaint.citizen.phone}
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Evidence, Map, Duplicate Detection & AI Risk */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Automated Classification Panel */}
          <Card className="border-gov-200 bg-gov-50/40">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gov-950 flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-gov-800" />
                  <span>AI Grievance Classification & Recommendation</span>
                </CardTitle>
                <span className="text-[10px] font-mono bg-gov-100 text-gov-800 px-2 py-0.5 rounded font-semibold">
                  {analysis?.modelProvider || 'Mock AI v2.4'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium block">Predicted Category:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {complaint.aiCategory || complaint.category?.name || 'General Civic'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Confidence Score:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {complaint.aiConfidence ? `${Math.round(complaint.aiConfidence * 100)}%` : '92%'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Suggested Priority:</span>
                  <span className="font-bold text-gov-900 text-sm">{complaint.priority}</span>
                </div>
              </div>

              {complaint.aiExplanation && (
                <p className="text-slate-600 leading-relaxed bg-white/70 p-3 rounded-lg border border-slate-200">
                  <strong>AI Rationale:</strong> {complaint.aiExplanation}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Suspicious Complaint & Fraud Risk Assessment Panel */}
          <FraudRiskMeter
            score={complaint.fraudRiskScore}
            level={complaint.fraudRiskLevel}
            reasons={flagReasons}
            recommendedAction={recommendedAction}
            showOfficerControls={true}
          />

          {/* Duplicate Detection Panel */}
          <DuplicateMatchCard
            matches={formattedMatches}
            basePath="/officer/complaints"
          />

          {/* Incident Location & Map */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gov-800" />
                <span>Geographic Verification & Street Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-700 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200">
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

          {/* Evidence Photos */}
          {complaint.images.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Citizen Photo Evidence ({complaint.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {complaint.images.map((img) => (
                    <div
                      key={img.id}
                      className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.storageUrl}
                        alt="Evidence"
                        className="h-56 w-full object-cover"
                      />
                      <div className="p-2.5 text-xs text-slate-600 flex justify-between items-center bg-white border-t border-slate-100">
                        <span className="truncate max-w-[200px]">{img.fileName}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {Math.round(img.fileSize / 1024)} KB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complete Status & Internal Audit History */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gov-700" />
                <span>Comprehensive Audit Timeline & Remarks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline
                history={complaint.statusHistory as any}
                currentStatus={complaint.status}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Officer Action Console */}
        <div className="space-y-6">
          <OfficerActionConsole
            complaintId={complaint.id}
            currentStatus={complaint.status}
          />

          {/* Department Ownership Card */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Assignment Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block">Department:</span>
                <span className="font-bold text-slate-800">
                  {complaint.department?.name || 'Unassigned'}
                </span>
              </div>

              {complaint.assignedOfficer && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block">Assigned Officer:</span>
                  <span className="font-bold text-slate-800">
                    {complaint.assignedOfficer.user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Badge: {complaint.assignedOfficer.employeeId}
                  </span>
                </div>
              )}

              {complaint.resolvedAt && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block">Resolved Timestamp:</span>
                  <span className="font-mono text-emerald-700">
                    {formatDate(complaint.resolvedAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
