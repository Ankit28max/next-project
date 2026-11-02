import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit';

const createDeptSchema = z.object({
  code: z.string().min(2).max(10).toUpperCase(),
  name: z.string().min(3).max(100),
  description: z.string().min(5).max(300),
  jurisdiction: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            officers: true,
            complaints: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const result = createDeptSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });
    }

    const { code, name, description, jurisdiction } = result.data;

    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Department code already exists' }, { status: 409 });
    }

    const newDept = await prisma.department.create({
      data: { code, name, description, jurisdiction },
    });

    await logAuditEvent({
      actorId: user.id,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: newDept.id,
      metadata: { code, name },
    });

    return NextResponse.json({ success: true, data: newDept });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to create department' }, { status: 500 });
  }
}
