import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { MIN_PASSWORD_LENGTH, hashPassword } from '@/lib/auth/password';
import { api, enforceRateLimit } from '@/lib/http';
import { logAudit } from '@/lib/audit';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(200),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
    .max(200)
    .regex(/[A-Za-z]/, 'Password must contain a letter.')
    .regex(/\d/, 'Password must contain a number.'),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,15}$/, 'Enter a valid phone number.').optional().or(z.literal('')),
});

export const POST = api(async (req) => {
  enforceRateLimit(req, 'register', 10, 60 * 60 * 1000);
  const input = registerSchema.parse(await req.json());

  // Hash first so the response takes the same time whether or not the email exists.
  const passwordHash = await hashPassword(input.password);
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (!existing) {
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash, phone: input.phone || null, role: 'CITIZEN' },
    });
    await logAudit({ actorId: user.id, action: 'REGISTERED', entityType: 'User', entityId: user.id });
  }

  // Same answer in both cases, and no automatic sign-in: the response must not
  // reveal whether an email address already has an account.
  return NextResponse.json({
    message: 'If this email was not registered before, your account is ready. Please sign in.',
  });
});
