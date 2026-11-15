import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/session';
import { api } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = api(async () => {
  const user = await requireRole('CITIZEN', 'OFFICER', 'ADMIN');
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  return NextResponse.json({ unread });
});

const patchSchema = z.object({ id: z.string().max(40).optional() });

/** PATCH { id } marks one notification as read; PATCH {} marks all. Only the caller's own. */
export const PATCH = api(async (req) => {
  const user = await requireRole('CITIZEN', 'OFFICER', 'ADMIN');
  const { id } = patchSchema.parse(await req.json());
  const result = await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null, ...(id ? { id } : {}) },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ updated: result.count });
});
