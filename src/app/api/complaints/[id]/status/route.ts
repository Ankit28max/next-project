import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { createNotification } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { ComplaintStatus } from '@/types';

const statusUpdateSchema = z.object({
  status: z.enum([
    'SUBMITTED',
    'UNDER_REVIEW',
    'ASSIGNED',
    'IN_PROGRESS',
    'AWAITING_CITIZEN_RESPONSE',
    'RESOLVED',
    'REJECTED',
    'REOPENED',
  ]),
  remarks: z.string().optional(),
  resolutionSummary: z.string().optional(),
  isInternal: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const result = statusUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { status: newStatus, remarks, resolutionSummary, isInternal } = result.data;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { citizen: true },
    });

    if (!complaint) {
      return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });
    }

    // Role-based permission logic
    if (user.role === 'CITIZEN') {
      // Citizen can ONLY reopen their own resolved complaint
      if (complaint.citizenId !== user.id) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
      if (newStatus !== 'REOPENED' || complaint.status !== 'RESOLVED') {
        return NextResponse.json(
          { success: false, error: 'Citizens can only reopen grievances that have been marked resolved' },
          { status: 400 }
        );
      }
    } else if (user.role === 'OFFICER') {
      // Officer must belong to the assigned department
      if (
        user.officerProfile?.departmentId &&
        complaint.departmentId &&
        complaint.departmentId !== user.officerProfile.departmentId
      ) {
        return NextResponse.json(
          { success: false, error: 'Officers can only update complaints within their department' },
          { status: 403 }
        );
      }
    }

    const previousStatus = complaint.status;

    // Multi-table transactional update
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update Complaint record
      const comp = await tx.complaint.update({
        where: { id },
        data: {
          status: newStatus as ComplaintStatus,
          resolutionSummary: newStatus === 'RESOLVED' ? resolutionSummary || remarks : complaint.resolutionSummary,
          resolvedAt: newStatus === 'RESOLVED' ? new Date() : complaint.resolvedAt,
          reopenedAt: newStatus === 'REOPENED' ? new Date() : complaint.reopenedAt,
        },
      });

      // 2. Insert into ComplaintStatusHistory
      await tx.complaintStatusHistory.create({
        data: {
          complaintId: id,
          actorId: user.id,
          previousStatus,
          newStatus: newStatus as ComplaintStatus,
          remarks: remarks || (newStatus === 'RESOLVED' ? resolutionSummary : `Status updated to ${newStatus}`),
          isInternal: isInternal || false,
        },
      });

      return comp;
    });

    // Notify citizen if status changed publicly
    if (!isInternal && complaint.citizenId !== user.id) {
      await createNotification({
        userId: complaint.citizenId,
        complaintId: complaint.id,
        title: `Grievance Status: ${newStatus}`,
        message: `Your grievance ${complaint.referenceNumber} status has changed from ${previousStatus} to ${newStatus}. ${remarks ? `Officer Remark: "${remarks}"` : ''}`,
        type: newStatus === 'RESOLVED' ? 'RESOLUTION' : 'STATUS_CHANGE',
      });
    }

    // Log Audit Event
    const ip = req.headers.get('x-forwarded-for') || req.ip;
    await logAuditEvent({
      actorId: user.id,
      action: 'STATUS_UPDATED',
      entityType: 'Complaint',
      entityId: complaint.id,
      metadata: {
        referenceNumber: complaint.referenceNumber,
        previousStatus,
        newStatus,
        remarks,
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: `Status updated to ${newStatus}`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update grievance status' },
      { status: 500 }
    );
  }
}
