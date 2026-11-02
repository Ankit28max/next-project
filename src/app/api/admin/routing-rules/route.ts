import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/audit';

const createRuleSchema = z.object({
  keywords: z.string().min(2, 'Keywords are required'),
  departmentId: z.string().min(1, 'Department is required'),
  categoryId: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const rules = await prisma.routingRule.findMany({
      include: {
        department: { select: { id: true, code: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch rules' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const result = createRuleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.errors[0].message }, { status: 400 });
    }

    const { keywords, departmentId, categoryId, priority } = result.data;

    const newRule = await prisma.routingRule.create({
      data: {
        keywords,
        departmentId,
        categoryId: categoryId || null,
        priority,
      },
      include: { department: true },
    });

    await logAuditEvent({
      actorId: user.id,
      action: 'ROUTING_RULE_CREATED',
      entityType: 'RoutingRule',
      entityId: newRule.id,
      metadata: { keywords, department: newRule.department.name },
    });

    return NextResponse.json({ success: true, data: newRule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to create rule' }, { status: 500 });
  }
}
