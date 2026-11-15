import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { startSession } from '@/lib/auth/session';
import { homePathForRole } from '@/lib/auth/token';
import { HttpError } from '@/lib/auth/guards';
import { api, clientIp, enforceRateLimit } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(200),
  password: z.string().min(1, 'Enter your password.').max(200),
});

const WINDOW_MS = 5 * 60 * 1000;

export const POST = api(async (req) => {
  enforceRateLimit(req, 'login-ip', 20, WINDOW_MS);
  const { email, password } = loginSchema.parse(await req.json());
  if (!rateLimit(`login-email:${email}`, 8, WINDOW_MS)) {
    throw new HttpError(429, 'Too many attempts for this account. Please wait a few minutes.');
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, active: true, passwordHash: true },
  });

  // One generic message for "unknown email", "wrong password" and "deactivated".
  const passwordOk = await verifyPassword(password, user?.passwordHash);
  if (!user || !passwordOk || !user.active) {
    console.warn(`Failed login for ${email} from ${clientIp(req)}`);
    await logAudit({ actorId: user?.id ?? null, action: 'LOGIN_FAILED', entityType: 'User', metadata: { email } });
    throw new HttpError(401, 'Incorrect email or password.');
  }

  await startSession(user.id, user.role);
  await logAudit({ actorId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id });
  return NextResponse.json({ redirectTo: homePathForRole(user.role) });
});
