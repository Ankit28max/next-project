import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, homePathForRole, signSessionToken, verifySessionToken, type Role } from './token';
import { assertRole, type SessionUser } from './guards';

/**
 * Reads the session cookie, verifies the JWT, then loads the user from the database.
 * The database lookup on every request means a deactivated account stops working immediately.
 * `cache` makes repeated calls within one request hit the database only once.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = await verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!token) return null;

  const user = await prisma.user.findUnique({
    where: { id: token.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      officerProfile: {
        select: { id: true, active: true, departmentId: true, department: { select: { name: true } } },
      },
    },
  });
  if (!user || !user.active) return null;

  const profile = user.officerProfile;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    officer:
      user.role === 'OFFICER' && profile?.active
        ? { id: profile.id, departmentId: profile.departmentId, departmentName: profile.department.name }
        : null,
  };
});

/** For API routes and Server Actions: throws HttpError 401/403. */
export async function requireRole(...allowed: Role[]): Promise<SessionUser> {
  return assertRole(await getSessionUser(), allowed);
}

/** For pages and layouts: redirects instead of throwing. */
export async function requireRolePage(...allowed: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!allowed.includes(user.role)) redirect(homePathForRole(user.role));
  return user;
}

export async function startSession(userId: string, role: Role): Promise<void> {
  cookies().set(SESSION_COOKIE, await signSessionToken({ userId, role }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function endSession(): void {
  cookies().delete(SESSION_COOKIE);
}
