// Runs before every matched request (Edge runtime). First line of defence only:
// it checks the session token and the role for each area. Pages and actions
// check again against the database (see lib/auth/session.ts).
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, homePathForRole, verifySessionToken, type Role } from '@/lib/auth/token';

const AREAS: { prefix: string; roles: Role[] }[] = [
  { prefix: '/citizen', roles: ['CITIZEN'] },
  { prefix: '/officer', roles: ['OFFICER'] },
  { prefix: '/admin', roles: ['ADMIN'] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === '/login' || pathname === '/register') {
    return session ? NextResponse.redirect(new URL(homePathForRole(session.role), req.url)) : NextResponse.next();
  }

  const area = AREAS.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
  if (!area) return NextResponse.next();
  if (!session) return NextResponse.redirect(new URL('/login', req.url));
  if (!area.roles.includes(session.role)) return NextResponse.redirect(new URL(homePathForRole(session.role), req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/citizen/:path*', '/officer/:path*', '/admin/:path*', '/login', '/register'],
};
