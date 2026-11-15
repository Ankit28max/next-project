import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

/** Used by the header to decide which links to show. Returns { user: null } when signed out. */
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user: user ? { name: user.name, role: user.role } : null });
}
