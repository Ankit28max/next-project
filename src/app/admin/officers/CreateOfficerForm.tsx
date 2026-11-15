'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { createOfficerAction } from '@/actions/admin';
import { Alert } from '@/components/ui/alert';
import { Input, Select } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';

export function CreateOfficerForm({ departments }: { departments: { id: string; name: string }[] }) {
  const [state, formAction] = useFormState(createOfficerAction, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={formAction} className="space-y-4">
      {state && <Alert variant={state.ok ? 'success' : 'error'}>{state.message}</Alert>}
      <Input label="Full name" name="name" required minLength={2} maxLength={100} />
      <Input label="Email" name="email" type="email" required autoComplete="off" />
      <Input label="Employee id" name="employeeId" required maxLength={30} />
      <Input label="Designation (optional)" name="designation" maxLength={100} />
      <Select label="Department" name="departmentId" required defaultValue="">
        <option value="" disabled>
          Choose a department
        </option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>
      <Input label="Initial password" name="password" type="password" required minLength={10} autoComplete="new-password" hint="At least 10 characters. Share it with the officer securely." />
      <SubmitButton>Create officer</SubmitButton>
    </form>
  );
}
