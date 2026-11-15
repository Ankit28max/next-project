// Shared wrapper for API route handlers: same-origin check, error mapping.
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from '@/lib/auth/guards';
import { rateLimit } from '@/lib/rate-limit';

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

export function clientIp(req: { headers: Headers }): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/** Browsers send an Origin header on POST/PATCH/DELETE. Reject requests from other sites. */
function assertSameOrigin(req: NextRequest): void {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }
  if (!originHost || originHost !== host) throw new HttpError(403, 'Cross-site request blocked.');
}

export function enforceRateLimit(req: NextRequest, name: string, limit: number, windowMs: number): void {
  if (!rateLimit(`${name}:${clientIp(req)}`, limit, windowMs)) {
    throw new HttpError(429, 'Too many requests. Please wait a minute and try again.');
  }
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: 'Request body is not valid JSON.' }, { status: 400 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (error.code === 'P2003') return NextResponse.json({ error: 'Referenced record does not exist.' }, { status: 400 });
  }
  console.error('Unhandled API error:', error);
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}

export function api<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') assertSameOrigin(req);
      return await handler(req, ctx);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
