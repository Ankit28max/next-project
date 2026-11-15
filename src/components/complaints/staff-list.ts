// Shared query + filter parsing for the officer queue and the admin complaint list.
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import type { ComplaintListItem } from './ComplaintList';

const STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_CITIZEN_RESPONSE', 'RESOLVED', 'REJECTED', 'REOPENED'] as const;

// Bad values fall back to "no filter" instead of causing an error.
export const staffFilterSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  status: z.enum(STATUSES).optional().catch(undefined),
  risk: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  mine: z.literal('1').optional().catch(undefined),
  triage: z.literal('1').optional().catch(undefined),
  department: z.string().max(40).optional().catch(undefined),
});
export type StaffFilters = z.infer<typeof staffFilterSchema>;

export const STAFF_PAGE_SIZE = 15;

export async function loadStaffList(scope: Prisma.ComplaintWhereInput, filters: StaffFilters): Promise<{ total: number; items: ComplaintListItem[] }> {
  const where: Prisma.ComplaintWhereInput = {
    ...scope,
    status: filters.status,
    fraudRiskLevel: filters.risk,
    ...(filters.triage ? { needsManualTriage: true } : {}),
    ...(filters.q
      ? { OR: [{ referenceNumber: { contains: filters.q.toUpperCase() } }, { title: { contains: filters.q, mode: 'insensitive' } }] }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      select: {
        id: true, referenceNumber: true, title: true, status: true, priority: true, createdAt: true,
        fraudRiskLevel: true, fraudRiskScore: true, needsManualTriage: true,
        category: { select: { name: true } },
        department: { select: { name: true } },
        _count: { select: { matchesAsSource: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * STAFF_PAGE_SIZE,
      take: STAFF_PAGE_SIZE,
    }),
  ]);
  return { total, items: rows.map(({ _count, ...row }) => ({ ...row, matchCount: _count.matchesAsSource })) };
}
