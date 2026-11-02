import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [categories, departments] = await Promise.all([
      prisma.complaintCategory.findMany({
        where: { active: true },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          defaultPriority: true,
          defaultDepartmentId: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.department.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        categories,
        departments,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve categories' },
      { status: 500 }
    );
  }
}
