import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/session';
import { HttpError, canAccessComplaint } from '@/lib/auth/guards';
import { api } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = api<{ params: { id: string } }>(async (_req, { params }) => {
  const user = await requireRole('CITIZEN', 'OFFICER', 'ADMIN');
  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
    select: {
      id: true, referenceNumber: true, citizenId: true, departmentId: true, title: true, description: true,
      address: true, latitude: true, longitude: true, status: true, priority: true, createdAt: true,
      resolutionSummary: true, fraudRiskScore: true, fraudRiskLevel: true, duplicateScore: true,
      category: { select: { name: true } },
      department: { select: { name: true } },
      statusHistory: {
        where: { isInternal: false },
        select: { newStatus: true, remarks: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  // Same answer for "does not exist" and "not yours": ids cannot be probed.
  if (!complaint || !canAccessComplaint(user, complaint)) throw new HttpError(404, 'Complaint not found.');

  // Risk and duplicate scores are for staff only.
  const { fraudRiskScore, fraudRiskLevel, duplicateScore, ...publicFields } = complaint;
  const data = user.role === 'CITIZEN' ? publicFields : { ...publicFields, fraudRiskScore, fraudRiskLevel, duplicateScore };
  return NextResponse.json({ data });
});
