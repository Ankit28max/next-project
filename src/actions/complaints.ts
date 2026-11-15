'use server';
// Server Actions: functions that run on the server but are called like normal
// functions from forms and client components. Next.js checks the request origin
// for them; every action below additionally checks who the user is.

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { HttpError, assertRole } from '@/lib/auth/guards';
import { clientIp } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { submitComplaint, type SubmitResult } from '@/lib/complaints/submit';
import { addInternalNote, reopenComplaint, updateStatus } from '@/lib/complaints/workflow';
import { runAction, type ActionState } from './result';

export async function submitComplaintAction(input: unknown): Promise<{ ok: true; result: SubmitResult } | { ok: false; message: string }> {
  try {
    const user = assertRole(await getSessionUser(), ['CITIZEN']);
    if (!rateLimit(`submit:${clientIp({ headers: headers() })}`, 10, 10 * 60 * 1000)) {
      throw new HttpError(429, 'Too many submissions. Please wait a few minutes.');
    }
    const result = await submitComplaint(user, input);
    revalidatePath('/citizen');
    return { ok: true, result };
  } catch (error) {
    if (error instanceof HttpError) return { ok: false, message: error.message };
    if (error instanceof ZodError) return { ok: false, message: error.issues[0]?.message ?? 'Invalid input.' };
    console.error('Submit failed:', error);
    return { ok: false, message: 'The complaint could not be saved. Please try again.' };
  }
}

export async function updateStatusAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction('Status updated. The citizen has been notified.', async () => {
    await updateStatus(await getSessionUser(), Object.fromEntries(form));
    revalidatePath('/officer', 'layout');
    revalidatePath('/admin', 'layout');
  });
}

export async function addNoteAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction('Internal note saved.', async () => {
    await addInternalNote(await getSessionUser(), Object.fromEntries(form));
    revalidatePath('/officer', 'layout');
    revalidatePath('/admin', 'layout');
  });
}

export async function reopenAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  return runAction('Complaint reopened. The department has been notified.', async () => {
    await reopenComplaint(await getSessionUser(), Object.fromEntries(form));
    revalidatePath('/citizen', 'layout');
  });
}
