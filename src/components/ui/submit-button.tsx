'use client';

import { useFormStatus } from 'react-dom';
import { Button } from './button';

/** A submit button that shows a spinner while its <form>'s Server Action is running. */
export function SubmitButton({ children, variant = 'primary', className }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'danger'; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} loading={pending} className={className}>
      {children}
    </Button>
  );
}
