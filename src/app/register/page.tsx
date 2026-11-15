import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = { title: 'Create an account' };

export default function RegisterPage() {
  return (
    <div className="page max-w-md">
      <h1>Create a citizen account</h1>
      <p className="mt-2 text-slate-700">You need an account to submit a complaint and follow its progress.</p>
      <Card className="mt-6">
        <RegisterForm />
      </Card>
      <p className="mt-4 text-sm text-slate-700">
        Already registered?{' '}
        <Link href="/login" className="link">
          Sign in
        </Link>
      </p>
    </div>
  );
}
