// Shared shape for Server Action results. Not a 'use server' file, so it may export helpers.
import { ZodError } from 'zod';
import { HttpError } from '@/lib/auth/guards';

export type ActionState = { ok: boolean; message: string } | null;

/** Runs a Server Action body and turns known errors into a message for the form. */
export async function runAction(successMessage: string, body: () => Promise<void>): Promise<ActionState> {
  try {
    await body();
    return { ok: true, message: successMessage };
  } catch (error) {
    if (error instanceof HttpError) return { ok: false, message: error.message };
    if (error instanceof ZodError) return { ok: false, message: error.issues[0]?.message ?? 'Invalid input.' };
    console.error('Server Action failed:', error);
    return { ok: false, message: 'Something went wrong. Please try again.' };
  }
}
