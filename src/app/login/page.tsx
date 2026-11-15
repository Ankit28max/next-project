import type { Metadata } from 'next';
import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage({ searchParams }: { searchParams: { registered?: string } }) {
  return (
    <div className="page max-w-md">
      <h1>Sign in</h1>
      <p className="mt-2 text-slate-700">For citizens, department officers and administrators.</p>
      {searchParams.registered && (
        <Alert variant="success" className="mt-4">
          If this email was not registered before, your account is ready. Please sign in.
        </Alert>
      )}
      <Card className="mt-6">
        <LoginForm />
      </Card>
      <p className="mt-4 text-sm text-slate-700">
        New here?{' '}
        <Link href="/register" className="link">
          Create a citizen account
        </Link>
      </p>
    </div>
  );
}
