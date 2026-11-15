// JWT helpers. Uses `jose` because it runs in both Node and the Edge runtime (middleware).
import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import { getJwtSecret } from '@/lib/env';

export const SESSION_COOKIE = 'jansetu_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type Role = 'CITIZEN' | 'OFFICER' | 'ADMIN';
const ROLES: Role[] = ['CITIZEN', 'OFFICER', 'ADMIN'];

export interface SessionToken {
  userId: string;
  role: Role;
}

export async function signSessionToken(payload: SessionToken): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionToken | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ['HS256'] });
    const role = payload.role as Role;
    if (!payload.sub || !ROLES.includes(role)) return null;
    return { userId: payload.sub, role };
  } catch {
    return null;
  }
}

export function homePathForRole(role: Role): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'OFFICER') return '/officer';
  return '/citizen';
}
