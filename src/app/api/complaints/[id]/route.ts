import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        citizen: { select: { id: true, name: true, email: true, phone: true } },
        category: true,
        department: true,
        assignedOfficer: {
          include: {
            user: { select: { name: true, email: true } },
            department: true,
          },
        },
        images: true,
        statusHistory: {
          include: {
            actor: { select: { name: true, role: true } },
          },
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

    if (!complaint) {
      return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });
    }

    // Role-based authorization check
    if (user.role === 'CITIZEN' && complaint.citizenId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    if (
      user.role === 'OFFICER' &&
      user.officerProfile?.departmentId &&
      complaint.departmentId &&
      complaint.departmentId !== user.officerProfile.departmentId
    ) {
      return NextResponse.json(
        { success: false, error: 'Access restricted to officer assigned department' },
        { status: 403 }
      );
    }

    // Sanitize response for citizen view
    if (user.role === 'CITIZEN') {
      const sanitized = {
        ...complaint,
        fraudRiskScore: undefined,
        fraudRiskLevel: undefined,
        statusHistory: complaint.statusHistory.filter((h) => !h.isInternal),
        matchesAsSource: [], // Duplicate matching comparisons are for department officers
        analyses: [],
      };
      return NextResponse.json({ success: true, data: sanitized });
    }

    // For Officer and Admin, return complete telemetry including AI signals and duplicate matches
    return NextResponse.json({ success: true, data: complaint });
  } catch (error: any) {
    console.error('Fetch complaint details error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve complaint details' },
      { status: 500 }
    );
  }
}
