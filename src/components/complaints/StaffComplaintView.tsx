// The complaint page used by officers and administrators: everything the
// analysis found, laid out for a human to judge.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Camera, GitCompareArrows, History, MapPin, ScanSearch, ShieldAlert, User } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { canAccessComplaint, type SessionUser } from '@/lib/auth/guards';
import { OFFICER_TARGET_STATUSES, canOfficerSetStatus } from '@/lib/complaints/workflow';
import { CATEGORIES, OTHER_CATEGORY } from '@/lib/ai/categories';
import { DUPLICATE, FRAUD } from '@/lib/ai/config';
import { distanceMeters } from '@/lib/geo';
import { formatDate, formatDistance } from '@/lib/utils';
import { Alert } from '@/components/ui/alert';
import { Notice } from '@/components/ui/notice';
import { PriorityBadge, RiskBadge, StatusBadge } from '@/components/ui/badges';
import { Card, CardTitle } from '@/components/ui/card';
import { ComplaintMapLazy } from '@/components/maps/ComplaintMapLazy';
import { Photo } from './Photo';
import { StatusTimeline } from './StatusTimeline';
import { NoteForm, StatusForm } from './StaffForms';

const CATEGORY_NAMES: Record<string, string> = Object.fromEntries([...CATEGORIES, OTHER_CATEGORY].map((c) => [c.code, c.name]));

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

export async function StaffComplaintView({ id, user, basePath, notice, children }: { id: string; user: SessionUser; basePath: string; notice?: string; children?: React.ReactNode }) {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    select: {
      id: true, referenceNumber: true, citizenId: true, departmentId: true, title: true, description: true,
      address: true, latitude: true, longitude: true, status: true, priority: true, urgencyDeclared: true, createdAt: true,
      fraudRiskScore: true, fraudRiskLevel: true, needsManualTriage: true, triageReason: true,
      citizen: { select: { name: true, email: true, phone: true } }, // never the password hash
      category: { select: { code: true, name: true } },
      department: { select: { name: true } },
      assignedOfficer: { select: { employeeId: true, user: { select: { name: true } } } },
      images: { take: 1 },
      analyses: { orderBy: { createdAt: 'desc' }, take: 1 },
      statusHistory: {
        select: { id: true, newStatus: true, remarks: true, isInternal: true, createdAt: true, actor: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
      matchesAsSource: {
        orderBy: { combinedScore: 'desc' },
        select: {
          id: true, combinedScore: true, textSimilarity: true, imageSimilarity: true, distanceMeters: true, reasons: true,
          matchedComplaint: {
            select: {
              id: true, referenceNumber: true, citizenId: true, departmentId: true, title: true, description: true,
              address: true, status: true, createdAt: true, images: { select: { storageUrl: true }, take: 1 },
            },
          },
        },
      },
    },
  });
  if (!complaint || !canAccessComplaint(user, complaint)) notFound();

  const image = complaint.images[0];
  const analysis = complaint.analyses[0];
  const allowedStatuses = OFFICER_TARGET_STATUSES.filter((s) => canOfficerSetStatus(complaint.status, s));
  const exifDistance =
    image?.exifLat != null && image.exifLng != null
      ? distanceMeters(complaint.latitude, complaint.longitude, image.exifLat, image.exifLng)
      : null;

  return (
    <div className="space-y-6">
      <Link href={basePath} className="link inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to the list
      </Link>

      <Notice code={notice} />

      <header>
        <p className="font-mono text-sm font-semibold text-slate-600">{complaint.referenceNumber}</p>
        <h1 className="mt-1">{complaint.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          <RiskBadge level={complaint.fraudRiskLevel} score={complaint.fraudRiskScore} />
        </div>
      </header>

      {complaint.needsManualTriage && (
        <Alert variant="warning" title="Needs manual triage">
          {complaint.triageReason} An administrator must assign a department.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardTitle icon={<User className="h-5 w-5 text-brand-700" aria-hidden />}>Report</CardTitle>
            <p className="whitespace-pre-line leading-relaxed text-slate-800">{complaint.description}</p>
            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-600">Citizen</dt>
                <dd className="font-medium">{complaint.citizen.name}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Contact</dt>
                <dd className="break-all font-medium">
                  {complaint.citizen.email}
                  {complaint.citizen.phone && `, ${complaint.citizen.phone}`}
                </dd>
              </div>
              <div>
                <dt className="text-slate-600">Submitted</dt>
                <dd className="font-medium">{formatDate(complaint.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Marked urgent by citizen</dt>
                <dd className="font-medium">{complaint.urgencyDeclared ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardTitle icon={<ScanSearch className="h-5 w-5 text-brand-700" aria-hidden />}>Automatic analysis (advisory)</CardTitle>
            {!analysis ? (
              <Alert variant="warning">The automatic analysis did not run for this complaint. Please review it fully by hand.</Alert>
            ) : (
              <div className="space-y-4 text-sm">
                {analysis.provider === 'rules' && (
                  <Alert variant="info" title="Running on fallback keyword rules">
                    {analysis.fallbackReason} The photo was not analysed by a vision model.
                  </Alert>
                )}
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-600">Suggested category</dt>
                    <dd className="font-medium">{CATEGORY_NAMES[analysis.categoryCode] ?? analysis.categoryCode}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Filed under</dt>
                    <dd className="font-medium">
                      {complaint.category?.name ?? 'Uncategorised'}
                      {complaint.category && complaint.category.code !== analysis.categoryCode && ' (chosen by the citizen)'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Answered by</dt>
                    <dd className="font-medium">{analysis.provider === 'gemini' ? `Vision model (${analysis.modelName})` : 'Keyword rules'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-600">Rule match strength</dt>
                    <dd className="font-medium">{analysis.ruleMatchStrength} keyword points (not a probability)</dd>
                  </div>
                  {analysis.imageMatchesText !== null && (
                    <div>
                      <dt className="text-slate-600">Photo matches the text</dt>
                      <dd className="font-medium">{analysis.imageMatchesText ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                  {analysis.looksLikeStockOrScreenshot !== null && (
                    <div>
                      <dt className="text-slate-600">Looks like stock image or screenshot</dt>
                      <dd className="font-medium">{analysis.looksLikeStockOrScreenshot ? 'Yes' : 'No'}</dd>
                    </div>
                  )}
                </dl>
                <div>
                  <p className="font-medium text-slate-800">Reasons</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
                    {asStrings(analysis.classificationReasons).map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                    <li>Routing: {analysis.routingReason}</li>
                  </ul>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <CardTitle icon={<ShieldAlert className="h-5 w-5 text-brand-700" aria-hidden />}>Risk signals (advisory)</CardTitle>
            {!analysis || complaint.fraudRiskLevel === null ? (
              <Alert variant="warning">Risk was not assessed. This does not mean the complaint is low risk.</Alert>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <RiskBadge level={complaint.fraudRiskLevel} score={complaint.fraudRiskScore} />
                  <span className="text-slate-600">
                    Score out of 100. Medium from {FRAUD.MEDIUM_AT}, high from {FRAUD.HIGH_AT}.
                  </span>
                </div>
                <ul className="list-disc space-y-1 pl-5 text-slate-800">
                  {asStrings(analysis.fraudReasons).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <p className="text-slate-600">
                  This score is a hint, not a verdict. It can be wrong in both directions. Software never rejects a complaint; that decision is yours.
                </p>
              </div>
            )}
          </Card>

          <Card>
            <CardTitle icon={<GitCompareArrows className="h-5 w-5 text-brand-700" aria-hidden />}>
              Possible duplicates ({complaint.matchesAsSource.length})
            </CardTitle>
            {complaint.matchesAsSource.length === 0 ? (
              <p className="text-sm text-slate-700">
                No similar complaint within {DUPLICATE.RADIUS_M} m in the last {DUPLICATE.WINDOW_DAYS} days scored {DUPLICATE.THRESHOLD} or higher.
              </p>
            ) : (
              <ul className="space-y-6">
                {complaint.matchesAsSource.map((match) => {
                  const other = match.matchedComplaint;
                  const canOpen = canAccessComplaint(user, other);
                  return (
                    <li key={match.id} className="rounded-lg border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Match score {match.combinedScore.toFixed(2)} (threshold {DUPLICATE.THRESHOLD})
                      </p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                        {asStrings(match.reasons).map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                      {/* Side-by-side comparison */}
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <CompareColumn heading="This complaint" reference={complaint.referenceNumber} title={complaint.title} description={complaint.description} address={complaint.address} date={complaint.createdAt} photo={image?.storageUrl} />
                        <CompareColumn
                          heading="Earlier complaint"
                          reference={other.referenceNumber}
                          title={other.title}
                          description={other.description}
                          address={other.address}
                          date={other.createdAt}
                          photo={other.images[0]?.storageUrl}
                          status={other.status}
                          href={canOpen ? `${basePath}/${other.id}` : undefined}
                          sameCitizen={other.citizenId === complaint.citizenId}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle icon={<History className="h-5 w-5 text-brand-700" aria-hidden />}>History and notes</CardTitle>
            <StatusTimeline entries={complaint.statusHistory} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle>Update status</CardTitle>
            <StatusForm complaintId={complaint.id} allowedStatuses={[...allowedStatuses]} />
          </Card>
          <Card>
            <CardTitle>Add internal note</CardTitle>
            <NoteForm complaintId={complaint.id} />
          </Card>
          {children}
          <Card>
            <CardTitle>Assignment</CardTitle>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-600">Department</dt>
                <dd className="font-medium">{complaint.department?.name ?? 'Not assigned'}</dd>
              </div>
              <div>
                <dt className="text-slate-600">Officer</dt>
                <dd className="font-medium">
                  {complaint.assignedOfficer ? `${complaint.assignedOfficer.user.name} (${complaint.assignedOfficer.employeeId})` : 'Not assigned'}
                </dd>
              </div>
            </dl>
          </Card>
          <Card>
            <CardTitle icon={<Camera className="h-5 w-5 text-brand-700" aria-hidden />}>Photo</CardTitle>
            {image ? (
              <>
                <Photo src={image.storageUrl} alt={`Photo submitted with complaint ${complaint.referenceNumber}`} />
                <dl className="mt-4 space-y-2 text-sm">
                  <div>
                    <dt className="text-slate-600">Camera metadata</dt>
                    <dd className="font-medium">{image.hasExif ? 'Present when uploaded (removed from the stored file)' : 'None'}</dd>
                  </div>
                  {image.exifTakenAt && (
                    <div>
                      <dt className="text-slate-600">Taken</dt>
                      <dd className="font-medium">{formatDate(image.exifTakenAt)}</dd>
                    </div>
                  )}
                  {exifDistance !== null && (
                    <div>
                      <dt className="text-slate-600">Photo GPS to map pin</dt>
                      <dd className="font-medium">{formatDistance(exifDistance)}</dd>
                    </div>
                  )}
                  {image.exifDevice && (
                    <div>
                      <dt className="text-slate-600">Device</dt>
                      <dd className="font-medium">{image.exifDevice}</dd>
                    </div>
                  )}
                  {image.exifSoftware && (
                    <div>
                      <dt className="text-slate-600">Software</dt>
                      <dd className="font-medium">{image.exifSoftware}</dd>
                    </div>
                  )}
                </dl>
              </>
            ) : (
              <p className="text-sm text-slate-700">No photo.</p>
            )}
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

function CompareColumn(props: {
  heading: string; reference: string; title: string; description: string; address: string; date: Date;
  photo?: string; status?: string; href?: string; sameCitizen?: boolean;
}) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{props.heading}</p>
      {props.photo ? (
        <Photo src={props.photo} alt={`Photo of complaint ${props.reference}`} />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-600">No photo</div>
      )}
      <p className="font-mono font-semibold">
        {props.href ? (
          <Link href={props.href} className="link">
            {props.reference}
          </Link>
        ) : (
          props.reference
        )}
      </p>
      <p className="font-semibold text-slate-900">{props.title}</p>
      <p className="line-clamp-4 text-slate-700">{props.description}</p>
      <p className="text-slate-600">{props.address}</p>
      <p className="text-slate-600">{formatDate(props.date)}</p>
      {props.status && <StatusBadge status={props.status} />}
      {props.sameCitizen !== undefined && <p className="text-slate-600">{props.sameCitizen ? 'Submitted by the same citizen' : 'Submitted by a different citizen'}</p>}
      {props.status && !props.href && <p className="text-slate-600">Belongs to another department.</p>}
    </div>
  );
}
