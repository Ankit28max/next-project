'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { HttpError, assertRole } from '@/lib/auth/guards';
import { MIN_PASSWORD_LENGTH, hashPassword } from '@/lib/auth/password';
import { reassignComplaint } from '@/lib/complaints/workflow';
import { runAction, type ActionState } from './result';

async function requireAdmin() {
  return assertRole(await getSessionUser(), ['ADMIN']);
}

const officerSchema = z.object({
  name: z.string().trim().min(2, 'Enter the officer name.').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(200),
  employeeId: z.string().trim().min(2, 'Enter an employee id.').max(30),
  designation: z.string().trim().max(100).optional(),
  departmentId: z.string().min(1, 'Choose a department.').max(40),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`).max(200),
});

export async function createOfficerAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const state = await runAction('', async () => {
    const admin = await requireAdmin();
    const input = officerSchema.parse(Object.fromEntries(form));

    const [department, emailTaken, employeeIdTaken] = await Promise.all([
      prisma.department.findUnique({ where: { id: input.departmentId }, select: { id: true } }),
      prisma.user.findUnique({ where: { email: input.email }, select: { id: true } }),
      prisma.officerProfile.findUnique({ where: { employeeId: input.employeeId }, select: { id: true } }),
    ]);
    if (!department) throw new HttpError(400, 'Unknown department.');
    if (emailTaken) throw new HttpError(400, 'An account with this email already exists.');
    if (employeeIdTaken) throw new HttpError(400, 'This employee id is already in use.');

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        role: 'OFFICER',
        passwordHash: await hashPassword(input.password),
        officerProfile: { create: { departmentId: department.id, employeeId: input.employeeId, designation: input.designation || null } },
      },
    });
    await prisma.auditLog.create({
      data: { actorId: admin.id, action: 'OFFICER_CREATED', entityType: 'User', entityId: user.id, metadata: { employeeId: input.employeeId } },
    });
    revalidatePath('/admin/officers');
  });
  if (state?.ok) redirect('/admin/officers?notice=officer-created');
  return state;
}

const setActiveSchema = z.object({ officerId: z.string().min(1).max(40), active: z.enum(['true', 'false']) });

/** Deactivating blocks sign-in and removes the officer from automatic assignment. Their cases stay with them until reassigned. */
export async function setOfficerActiveAction(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const input = setActiveSchema.parse(Object.fromEntries(form));
  const active = input.active === 'true';
  const profile = await prisma.officerProfile.update({
    where: { id: input.officerId },
    data: { active, user: { update: { active } } },
    select: { userId: true },
  });
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: active ? 'OFFICER_ACTIVATED' : 'OFFICER_DEACTIVATED', entityType: 'User', entityId: profile.userId },
  });
  revalidatePath('/admin/officers');
  redirect('/admin/officers?notice=officer-updated');
}

const ruleSchema = z.object({
  ruleId: z.string().max(40).optional(),
  keywords: z
    .string()
    .trim()
    .min(2, 'Enter at least one keyword.')
    .max(300)
    .transform((value) => value.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean).join(', '))
    .refine((value) => value.length > 0, 'Enter at least one keyword.'),
  departmentId: z.string().min(1, 'Choose a department.').max(40),
  position: z.coerce.number().int().min(1).max(999).default(100),
});

/** Creates a routing rule, or updates it when the form contains a ruleId. */
export async function saveRoutingRuleAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const state = await runAction('', async () => {
    const admin = await requireAdmin();
    const { ruleId, ...data } = ruleSchema.parse(Object.fromEntries(form));
    const department = await prisma.department.findUnique({ where: { id: data.departmentId }, select: { id: true } });
    if (!department) throw new HttpError(400, 'Unknown department.');

    const rule = ruleId
      ? await prisma.routingRule.update({ where: { id: ruleId }, data })
      : await prisma.routingRule.create({ data });
    await prisma.auditLog.create({
      data: { actorId: admin.id, action: ruleId ? 'ROUTING_RULE_UPDATED' : 'ROUTING_RULE_CREATED', entityType: 'RoutingRule', entityId: rule.id, metadata: data },
    });
    revalidatePath('/admin/routing');
  });
  if (state?.ok) redirect('/admin/routing?notice=rule-saved');
  return state;
}

const toggleRuleSchema = z.object({ ruleId: z.string().min(1).max(40), active: z.enum(['true', 'false']) });

export async function setRoutingRuleActiveAction(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const input = toggleRuleSchema.parse(Object.fromEntries(form));
  await prisma.routingRule.update({ where: { id: input.ruleId }, data: { active: input.active === 'true' } });
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: 'ROUTING_RULE_TOGGLED', entityType: 'RoutingRule', entityId: input.ruleId, metadata: { active: input.active } },
  });
  revalidatePath('/admin/routing');
  redirect('/admin/routing?notice=rule-updated');
}

export async function reassignAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const state = await runAction('', async () => {
    const raw = Object.fromEntries(form);
    await reassignComplaint(await getSessionUser(), { ...raw, officerId: raw.officerId || undefined });
    revalidatePath('/', 'layout');
  });
  if (state?.ok) redirect(`/admin/complaints/${encodeURIComponent(String(form.get('complaintId')))}?notice=reassigned`);
  return state;
}
