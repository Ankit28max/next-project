'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { addNoteAction, updateStatusAction } from '@/actions/complaints';
import { reassignAction } from '@/actions/admin';
import { Alert } from '@/components/ui/alert';
import { Select, Textarea } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';
import { STATUS_LABELS } from '@/components/ui/badges';

/** Officer / admin: change the status. The remark is shown to the citizen. */
export function StatusForm({ complaintId, allowedStatuses }: { complaintId: string; allowedStatuses: string[] }) {
  const [state, formAction] = useFormState(updateStatusAction, null);
  if (allowedStatuses.length === 0) {
    return <p className="text-sm text-slate-700">This complaint is closed. It can change again only if the citizen reopens it.</p>;
  }
  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && <Alert variant="error">{state.message}</Alert>}
      <input type="hidden" name="complaintId" value={complaintId} />
      <Select label="New status" name="status" required defaultValue="">
        <option value="" disabled>
          Choose a status
        </option>
        {allowedStatuses.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </Select>
      <Textarea label="Remark for the citizen" hint="Visible to the citizen. For Resolved, describe what was done." name="remarks" rows={3} required minLength={5} maxLength={2000} />
      <SubmitButton>Update status</SubmitButton>
    </form>
  );
}

export function NoteForm({ complaintId }: { complaintId: string }) {
  const [state, formAction] = useFormState(addNoteAction, null);
  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && <Alert variant="error">{state.message}</Alert>}
      <input type="hidden" name="complaintId" value={complaintId} />
      <Textarea label="Internal note" hint="Only officers and administrators can read this." name="note" rows={2} required minLength={3} maxLength={2000} />
      <SubmitButton variant="secondary">Save note</SubmitButton>
    </form>
  );
}

interface ReassignProps {
  complaintId: string;
  currentDepartmentId: string | null;
  departments: { id: string; name: string }[];
  officers: { id: string; name: string; departmentId: string; openCases: number }[];
}

/** Admin only: send the complaint to a department and, optionally, a specific officer. */
export function ReassignForm({ complaintId, currentDepartmentId, departments, officers }: ReassignProps) {
  const [state, formAction] = useFormState(reassignAction, null);
  const [departmentId, setDepartmentId] = useState(currentDepartmentId ?? '');
  const available = officers.filter((o) => o.departmentId === departmentId);
  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && <Alert variant="error">{state.message}</Alert>}
      <input type="hidden" name="complaintId" value={complaintId} />
      <Select label="Department" name="departmentId" required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
        <option value="" disabled>
          Choose a department
        </option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>
      <Select label="Officer (optional)" name="officerId" defaultValue="" key={departmentId}>
        <option value="">No specific officer</option>
        {available.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} ({o.openCases} open)
          </option>
        ))}
      </Select>
      <SubmitButton>Reassign</SubmitButton>
    </form>
  );
}
