'use server';
// Server Actions: functions that run on the server but are called like normal
// functions from forms and client components. Next.js checks the request origin
// for them; every action below additionally checks who the user is.

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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

/** Where a staff member views a complaint. Built on the server, never taken from the form. */
async function staffComplaintPath(form: FormData): Promise<string> {
  const user = await getSessionUser();
  const area = user?.role === 'ADMIN' ? 'admin' : 'officer';
  return `/${area}/complaints/${encodeURIComponent(String(form.get('complaintId')))}`;
}

// Pattern used by the actions below (Post/Redirect/Get):
// - on failure, return a message that the form shows through useFormState
// - on success, redirect back to the page with ?notice=<code>; the page renders the confirmation
export async function updateStatusAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const state = await runAction('', async () => {
    await updateStatus(await getSessionUser(), Object.fromEntries(form));
    revalidatePath('/', 'layout');
  });
  if (state?.ok) redirect(`${await staffComplaintPath(form)}?notice=status-updated`);
  return state;
}

export async function addNoteAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const state = await runAction('', async () => {
    await addInternalNote(await getSessionUser(), Object.fromEntries(form));
    revalidatePath('/', 'layout');
  });
  if (state?.ok) redirect(`${await staffComplaintPath(form)}?notice=note-saved`);
  return state;
}

export async function reopenAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const state = await runAction('', async () => {
    await reopenComplaint(await getSessionUser(), Object.fromEntries(form));
    revalidatePath('/', 'layout');
  });
  if (state?.ok) redirect(`/citizen/complaints/${encodeURIComponent(String(form.get('complaintId')))}?notice=reopened`);
  return state;
}
