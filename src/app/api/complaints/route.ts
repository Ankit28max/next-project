import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/session';
import { complaintScope } from '@/lib/auth/guards';
import { api, enforceRateLimit } from '@/lib/http';
import { submitComplaint } from '@/lib/complaints/submit';

export const dynamic = 'force-dynamic';

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_CITIZEN_RESPONSE', 'RESOLVED', 'REJECTED', 'REOPENED'] as const;

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(STATUSES).optional(),
});

/** GET /api/complaints?page=1&limit=20&status=ASSIGNED : only complaints the caller may see. */
export const GET = api(async (req) => {
  const user = await requireRole('CITIZEN', 'OFFICER', 'ADMIN');
  const query = listQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const where = { ...complaintScope(user), status: query.status };

  const [total, complaints] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      select: {
        id: true, referenceNumber: true, title: true, status: true, priority: true, createdAt: true,
        category: { select: { name: true } },
        department: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);
  return NextResponse.json({ data: complaints, page: query.page, limit: query.limit, total });
});

/** POST /api/complaints : same pipeline as the Server Action, for API clients. */
export const POST = api(async (req) => {
  const user = await requireRole('CITIZEN');
  enforceRateLimit(req, 'submit', 10, 10 * 60 * 1000);
  const result = await submitComplaint(user, await req.json());
  return NextResponse.json({ data: result }, { status: 201 });
});
