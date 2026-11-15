import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Building2, CheckCircle2, History, MapPin } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { canAccessComplaint } from '@/lib/auth/guards';
import { canCitizenReopen } from '@/lib/complaints/workflow';
import { formatDate } from '@/lib/utils';
import { PriorityBadge, StatusBadge } from '@/components/ui/badges';
import { Card, CardTitle } from '@/components/ui/card';
import { Photo } from '@/components/complaints/Photo';
import { StatusTimeline } from '@/components/complaints/StatusTimeline';
import { ComplaintMapLazy } from '@/components/maps/ComplaintMapLazy';
import { ReopenForm } from './ReopenForm';

export const metadata: Metadata = { title: 'Complaint' };

export default async function CitizenComplaintPage({ params }: { params: { id: string } }) {
  const user = await requireRolePage('CITIZEN');
  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
    // `select` lists exactly what a citizen may see: no risk score, no duplicate links, no internal notes.
    select: {
      id: true, referenceNumber: true, citizenId: true, departmentId: true, title: true, description: true,
      address: true, latitude: true, longitude: true, status: true, priority: true, createdAt: true,
      resolutionSummary: true, resolvedAt: true,
      category: { select: { name: true } },
      department: { select: { name: true } },
      images: { select: { storageUrl: true }, take: 1 },
      statusHistory: {
        where: { isInternal: false },
        select: { id: true, newStatus: true, remarks: true, isInternal: true, createdAt: true, actor: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  // Someone else's complaint looks exactly like one that does not exist.
  if (!complaint || !canAccessComplaint(user, complaint)) notFound();

  return (
    <div className="space-y-6">
      <Link href="/citizen/complaints" className="link inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        My complaints
      </Link>

      <header>
        <p className="font-mono text-sm font-semibold text-slate-600">{complaint.referenceNumber}</p>
        <h1 className="mt-1">{complaint.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
        </div>
      </header>

      {complaint.status === 'RESOLVED' && complaint.resolutionSummary && (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardTitle icon={<CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden />}>Resolution</CardTitle>
          <p className="whitespace-pre-line text-slate-800">{complaint.resolutionSummary}</p>
          <p className="mt-2 text-sm text-slate-600">Resolved on {formatDate(complaint.resolvedAt)}</p>
        </Card>
      )}

      {canCitizenReopen(complaint.status) && (
        <Card>
          <CardTitle>Not satisfied with the outcome?</CardTitle>
          <ReopenForm complaintId={complaint.id} />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardTitle>What you reported</CardTitle>
            <p className="whitespace-pre-line leading-relaxed text-slate-800">{complaint.description}</p>
            <p className="mt-3 text-sm text-slate-600">Submitted on {formatDate(complaint.createdAt)}</p>
            {complaint.images[0] && <Photo src={complaint.images[0].storageUrl} alt="Photo you attached to this complaint" className="mt-4 max-w-md" />}
          </Card>
          <Card>
            <CardTitle icon={<History className="h-5 w-5 text-brand-700" aria-hidden />}>Progress</CardTitle>
            <StatusTimeline entries={complaint.statusHistory} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle icon={<Building2 className="h-5 w-5 text-brand-700" aria-hidden />}>Handled by</CardTitle>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-600">Department</dt>
                <dd className="font-medium">{complaint.department?.name ?? 'Waiting to be assigned'}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Category</dt>
                <dd className="font-medium">{complaint.category?.name ?? 'Not yet categorised'}</dd>
              </div>
            </dl>
          </Card>
          <Card>
            <CardTitle icon={<MapPin className="h-5 w-5 text-brand-700" aria-hidden />}>Location</CardTitle>
            <p className="mb-3 text-sm text-slate-800">{complaint.address}</p>
            <ComplaintMapLazy latitude={complaint.latitude} longitude={complaint.longitude} />
          </Card>
        </div>
      </div>
    </div>
  );
}
