import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { AuthUser, Role } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'academic-demo-jwt-secret-key-super-secure-min-32-chars-2026';
export const AUTH_COOKIE_NAME = 'grievance_session_token';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export function signSessionToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifySessionToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Retrieves the currently authenticated user from the request cookie session
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifySessionToken(token);
    if (!decoded || !decoded.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        officerProfile: {
          select: {
            id: true,
            departmentId: true,
            employeeId: true,
            department: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;
    return user as AuthUser;
  } catch (err) {
    return null;
  }
}

/**
 * Server-side guard to strictly enforce role-based access
 */
export async function requireAuth(allowedRoles?: Role[]): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: Authentication required to access this resource');
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error(`FORBIDDEN: Access denied for role ${user.role}`);
  }

  return user;
}
