// Status changes after submission: officer updates, citizen reopen, admin reassign.
// Every function checks authorization itself, so it is safe no matter who calls it.
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { HttpError, assertRole, canAccessComplaint, type SessionUser } from '@/lib/auth/guards';

export type Status =
  | 'SUBMITTED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS'
  | 'AWAITING_CITIZEN_RESPONSE' | 'RESOLVED' | 'REJECTED' | 'REOPENED';

export const CLOSED_STATUSES: Status[] = ['RESOLVED', 'REJECTED'];
/** Statuses an officer may set. SUBMITTED, ASSIGNED and REOPENED are set by the system or the citizen. */
export const OFFICER_TARGET_STATUSES = ['UNDER_REVIEW', 'IN_PROGRESS', 'AWAITING_CITIZEN_RESPONSE', 'RESOLVED', 'REJECTED'] as const;

export function canOfficerSetStatus(from: Status, to: Status): boolean {
  if (CLOSED_STATUSES.includes(from)) return false; // closed cases change only when the citizen reopens
  return (OFFICER_TARGET_STATUSES as readonly string[]).includes(to) && from !== to;
}

export function canCitizenReopen(from: Status): boolean {
  return CLOSED_STATUSES.includes(from);
}

async function loadComplaint(id: string) {
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    select: {
      id: true, referenceNumber: true, citizenId: true, departmentId: true, status: true,
      assignedOfficer: { select: { userId: true } },
    },
  });
  if (!complaint) throw new HttpError(404, 'Complaint not found.');
  return complaint;
}

export const statusUpdateSchema = z.object({
  complaintId: z.string().min(1).max(40),
  status: z.enum(OFFICER_TARGET_STATUSES),
  remarks: z.string().trim().min(5, 'Please write a short remark (at least 5 characters).').max(2000),
});

export async function updateStatus(user: SessionUser | null, raw: unknown): Promise<void> {
  const actor = assertRole(user, ['OFFICER', 'ADMIN']);
  const input = statusUpdateSchema.parse(raw);
  const complaint = await loadComplaint(input.complaintId);
  if (!canAccessComplaint(actor, complaint)) throw new HttpError(403, 'This complaint belongs to another department.');
  if (!canOfficerSetStatus(complaint.status, input.status)) {
    throw new HttpError(400, `A complaint that is ${complaint.status} cannot be changed to ${input.status}.`);
  }

  const resolved = input.status === 'RESOLVED';
  await prisma.$transaction([
    prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: input.status,
        resolutionSummary: resolved ? input.remarks : undefined,
        resolvedAt: resolved ? new Date() : undefined,
      },
    }),
    prisma.complaintStatusHistory.create({
      data: { complaintId: complaint.id, actorId: actor.id, previousStatus: complaint.status, newStatus: input.status, remarks: input.remarks },
    }),
    prisma.notification.create({
      data: {
        userId: complaint.citizenId,
        complaintId: complaint.id,
        title: `${complaint.referenceNumber}: status changed`,
        message: input.remarks,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id, action: 'STATUS_UPDATED', entityType: 'Complaint', entityId: complaint.id,
        metadata: { from: complaint.status, to: input.status },
      },
    }),
  ]);
}

export const noteSchema = z.object({
  complaintId: z.string().min(1).max(40),
  note: z.string().trim().min(3, 'The note is too short.').max(2000),
});

/** Internal notes are visible to officers and admins only. */
export async function addInternalNote(user: SessionUser | null, raw: unknown): Promise<void> {
  const actor = assertRole(user, ['OFFICER', 'ADMIN']);
  const input = noteSchema.parse(raw);
  const complaint = await loadComplaint(input.complaintId);
  if (!canAccessComplaint(actor, complaint)) throw new HttpError(403, 'This complaint belongs to another department.');
  await prisma.complaintStatusHistory.create({
    data: {
      complaintId: complaint.id, actorId: actor.id, previousStatus: complaint.status, newStatus: complaint.status,
      remarks: input.note, isInternal: true,
    },
  });
}

export const reopenSchema = z.object({
  complaintId: z.string().min(1).max(40),
  reason: z.string().trim().min(10, 'Please explain in a sentence why the issue is not resolved.').max(1000),
});

export async function reopenComplaint(user: SessionUser | null, raw: unknown): Promise<void> {
  const actor = assertRole(user, ['CITIZEN']);
  const input = reopenSchema.parse(raw);
  const complaint = await loadComplaint(input.complaintId);
  if (!canAccessComplaint(actor, complaint)) throw new HttpError(403, 'You can only reopen your own complaints.');
  if (!canCitizenReopen(complaint.status)) throw new HttpError(400, 'Only resolved or rejected complaints can be reopened.');

  await prisma.$transaction([
    prisma.complaint.update({ where: { id: complaint.id }, data: { status: 'REOPENED', reopenedAt: new Date(), resolvedAt: null } }),
    prisma.complaintStatusHistory.create({
      data: { complaintId: complaint.id, actorId: actor.id, previousStatus: complaint.status, newStatus: 'REOPENED', remarks: input.reason },
    }),
    ...(complaint.assignedOfficer
      ? [
          prisma.notification.create({
            data: {
              userId: complaint.assignedOfficer.userId,
              complaintId: complaint.id,
              title: `${complaint.referenceNumber}: reopened by the citizen`,
              message: input.reason,
            },
          }),
        ]
      : []),
    prisma.auditLog.create({
      data: { actorId: actor.id, action: 'COMPLAINT_REOPENED', entityType: 'Complaint', entityId: complaint.id },
    }),
  ]);
}

export const reassignSchema = z.object({
  complaintId: z.string().min(1).max(40),
  departmentId: z.string().min(1).max(40),
  officerId: z.string().max(40).optional(),
});

/** Manual routing is an admin-only action. */
export async function reassignComplaint(user: SessionUser | null, raw: unknown): Promise<void> {
  const actor = assertRole(user, ['ADMIN']);
  const input = reassignSchema.parse(raw);
  const complaint = await loadComplaint(input.complaintId);

  const department = await prisma.department.findUnique({ where: { id: input.departmentId }, select: { id: true, name: true } });
  if (!department) throw new HttpError(400, 'Unknown department.');
  const officer = input.officerId
    ? await prisma.officerProfile.findFirst({
        where: { id: input.officerId, departmentId: department.id, active: true },
        select: { id: true, userId: true },
      })
    : null;
  if (input.officerId && !officer) throw new HttpError(400, 'That officer is not an active member of the chosen department.');

  const isClosed = CLOSED_STATUSES.includes(complaint.status);
  const newStatus = officer && !isClosed ? 'ASSIGNED' : complaint.status;
  await prisma.$transaction([
    prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        departmentId: department.id, assignedOfficerId: officer?.id ?? null, status: newStatus,
        needsManualTriage: false, triageReason: null,
      },
    }),
    prisma.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id, actorId: actor.id, previousStatus: complaint.status, newStatus,
        remarks: `Manually routed to ${department.name} by an administrator.`, isInternal: true,
      },
    }),
    ...(officer
      ? [
          prisma.notification.create({
            data: { userId: officer.userId, complaintId: complaint.id, title: `Complaint assigned: ${complaint.referenceNumber}`, message: 'Assigned to you by an administrator.' },
          }),
        ]
      : []),
    prisma.auditLog.create({
      data: {
        actorId: actor.id, action: 'COMPLAINT_REASSIGNED', entityType: 'Complaint', entityId: complaint.id,
        metadata: { departmentId: department.id, officerId: officer?.id ?? null },
      },
    }),
  ]);
}
