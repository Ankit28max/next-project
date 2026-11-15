'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/session';

/** Marks one notification (form field "id") or all of the user's notifications as read. */
export async function markReadAction(form: FormData): Promise<void> {
  const user = await requireRole('CITIZEN', 'OFFICER', 'ADMIN');
  const id = form.get('id');
  await prisma.notification.updateMany({
    // userId in the filter means nobody can mark someone else's notification.
    where: { userId: user.id, readAt: null, ...(typeof id === 'string' && id ? { id } : {}) },
    data: { readAt: new Date() },
  });
  revalidatePath('/', 'layout');
}
