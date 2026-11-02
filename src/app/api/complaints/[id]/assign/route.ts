import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

const assignSchema = z.object({
  departmentId: z.string().optional(),
  assignedOfficerId: z.string().optional().nullable(),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'OFFICER')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const result = assignSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { departmentId, assignedOfficerId, reason } = result.data;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
    });

    if (!complaint) {
      return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const comp = await tx.complaint.update({
        where: { id },
        data: {
          departmentId: departmentId || complaint.departmentId,
          assignedOfficerId: assignedOfficerId !== undefined ? assignedOfficerId : complaint.assignedOfficerId,
          status: assignedOfficerId ? 'ASSIGNED' : complaint.status,
        },
      });

      await tx.complaintStatusHistory.create({
        data: {
          complaintId: id,
          actorId: user.id,
          previousStatus: complaint.status,
          newStatus: assignedOfficerId ? 'ASSIGNED' : complaint.status,
          remarks: `Reassigned by ${user.name}. ${reason ? `Reason: ${reason}` : ''}`,
          isInternal: true,
        },
      });

      return comp;
    });

    // Notify newly assigned officer if present
    if (assignedOfficerId) {
      const officer = await prisma.officerProfile.findUnique({
        where: { id: assignedOfficerId },
      });
      if (officer) {
        await createNotification({
          userId: officer.userId,
          complaintId: id,
          title: `New Grievance Assigned: ${complaint.referenceNumber}`,
          message: `Grievance has been assigned to your queue by ${user.name}.`,
          type: 'ASSIGNMENT',
        });
      }
    }

    // Log Audit Event
    await logAuditEvent({
      actorId: user.id,
      action: 'COMPLAINT_REASSIGNED',
      entityType: 'Complaint',
      entityId: id,
      metadata: { departmentId, assignedOfficerId, reason },
    });

    return NextResponse.json({
      success: true,
      message: 'Grievance reassigned successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Reassignment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reassign complaint' },
      { status: 500 }
    );
  }
}
