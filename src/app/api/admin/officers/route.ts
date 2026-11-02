import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const officers = await prisma.officerProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        department: { select: { id: true, code: true, name: true } },
        complaintsAssigned: {
          select: { id: true, status: true, priority: true },
        },
      },
      orderBy: { employeeId: 'asc' },
    });

    const formatted = officers.map((off) => ({
      id: off.id,
      employeeId: off.employeeId,
      badgeNumber: off.badgeNumber,
      designation: off.designation,
      active: off.active,
      name: off.user.name,
      email: off.user.email,
      phone: off.user.phone,
      department: off.department.name,
      departmentCode: off.department.code,
      totalAssigned: off.complaintsAssigned.length,
      activeWorkload: off.complaintsAssigned.filter((c) =>
        ['ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'].includes(c.status)
      ).length,
      resolvedCount: off.complaintsAssigned.filter((c) => c.status === 'RESOLVED').length,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch officers' }, { status: 500 });
  }
}
