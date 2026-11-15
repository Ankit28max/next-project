'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/login?registered=1');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not create the account. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <Input label="Full name" name="name" autoComplete="name" required minLength={2} maxLength={100} />
      <Input label="Email" name="email" type="email" autoComplete="email" required />
      <Input label="Phone (optional)" name="phone" type="tel" autoComplete="tel" />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        hint="At least 10 characters, with a letter and a number."
      />
      <p className="text-sm text-slate-600">
        We store your name, email and optional phone number to handle your complaints. See the{' '}
        <Link href="/privacy" className="link">
          privacy page
        </Link>
        .
      </p>
      <Button type="submit" loading={loading} className="w-full">
        Create account
      </Button>
    </form>
  );
}
