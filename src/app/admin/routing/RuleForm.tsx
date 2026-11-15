'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { saveRoutingRuleAction } from '@/actions/admin';
import { Alert } from '@/components/ui/alert';
import { Input, Select } from '@/components/ui/field';
import { SubmitButton } from '@/components/ui/submit-button';

interface Rule {
  id: string;
  keywords: string;
  departmentId: string;
  position: number;
}

/** Used both to add a rule (no `rule` prop) and to edit an existing one. */
export function RuleForm({ departments, rule }: { departments: { id: string; name: string }[]; rule?: Rule }) {
  const [state, formAction] = useFormState(saveRoutingRuleAction, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && !rule) form.current?.reset();
  }, [state, rule]);

  return (
    <form ref={form} action={formAction} className="space-y-4">
      {state && <Alert variant={state.ok ? 'success' : 'error'}>{state.message}</Alert>}
      {rule && <input type="hidden" name="ruleId" value={rule.id} />}
      <Input label="Keywords" hint="Separate with commas, for example: school, hospital" name="keywords" defaultValue={rule?.keywords} required maxLength={300} />
      <Select label="Send to department" name="departmentId" required defaultValue={rule?.departmentId ?? ''}>
        <option value="" disabled>
          Choose a department
        </option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>
      <Input label="Order" hint="Lower numbers are checked first." name="position" type="number" min={1} max={999} defaultValue={rule?.position ?? 100} required />
      <SubmitButton variant={rule ? 'secondary' : 'primary'}>{rule ? 'Save changes' : 'Add rule'}</SubmitButton>
    </form>
  );
}
