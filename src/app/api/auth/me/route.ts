import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { api } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = api(async () => {
  const user = await requireRole('CITIZEN', 'OFFICER', 'ADMIN');
  return NextResponse.json({ user });
});
