import * as React from 'react';
import { cn } from '@/lib/utils';

const CONTROL =
  'block w-full rounded-lg border border-slate-400 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 disabled:bg-slate-100 sm:text-sm';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
}

function Wrapper({ id, label, hint, error, children }: FieldProps & { id: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-sm text-slate-600">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
}

export function Input({ label, hint, error, className, id, ...props }: FieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const generated = React.useId();
  const fieldId = id ?? generated;
  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error}>
      <input id={fieldId} aria-invalid={Boolean(error)} aria-describedby={describedBy(fieldId, hint, error)} className={cn(CONTROL, 'min-h-[2.75rem]', className)} {...props} />
    </Wrapper>
  );
}

export function Textarea({ label, hint, error, className, id, ...props }: FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generated = React.useId();
  const fieldId = id ?? generated;
  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error}>
      <textarea id={fieldId} aria-invalid={Boolean(error)} aria-describedby={describedBy(fieldId, hint, error)} className={cn(CONTROL, className)} {...props} />
    </Wrapper>
  );
}

export function Select({ label, hint, error, className, id, children, ...props }: FieldProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const generated = React.useId();
  const fieldId = id ?? generated;
  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error}>
      <select id={fieldId} aria-describedby={describedBy(fieldId, hint, error)} className={cn(CONTROL, 'min-h-[2.75rem]', className)} {...props}>
        {children}
      </select>
    </Wrapper>
  );
}
