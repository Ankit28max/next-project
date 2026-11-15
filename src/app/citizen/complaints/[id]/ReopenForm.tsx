'use client';

import { useFormState } from 'react-dom';
import { reopenAction } from '@/actions/complaints';
import { Alert } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';

/** The form's `action` is a Server Action: no API route and no client-side fetch code. */
export function ReopenForm({ complaintId }: { complaintId: string }) {
  const [state, formAction] = useFormState(reopenAction, null);
  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && <Alert variant="error">{state.message}</Alert>}
      <input type="hidden" name="complaintId" value={complaintId} />
      <Textarea
        label="Why should this complaint be reopened?"
        hint="For example: the pothole was filled but has opened again."
        name="reason"
        rows={3}
        required
        minLength={10}
        maxLength={1000}
      />
      <SubmitButton variant="secondary">Reopen complaint</SubmitButton>
    </form>
  );
}
