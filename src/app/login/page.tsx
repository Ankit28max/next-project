'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Landmark, Lock, LogIn, Mail, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }

      router.push(data.redirectUrl || '/citizen');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gov-900 text-white shadow">
            <Landmark className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gov-900">
            Sign In to Grievance Portal
          </h2>
          <p className="text-xs text-slate-500">
            Citizen, Department Officer & System Administrator Access
          </p>
        </div>

        <Card className="border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle>Account Credentials</CardTitle>
            <CardDescription>Enter your email and password to proceed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="danger" title="Authentication Error">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@grievance.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-500">
              Don&apos;t have a citizen account?{' '}
              <Link href="/register" className="text-gov-700 font-semibold hover:underline">
                Register as Citizen
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Demo Credentials Assistant */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <UserCheck className="h-4 w-4 text-gov-700" />
            <span>Academic Demonstration Autofill:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('citizen@grievance.gov.in', 'Citizen@123')}
              className="text-left p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs transition-colors"
            >
              <span className="font-semibold text-slate-900 block">Citizen</span>
              <span className="text-[10px] text-slate-500 block truncate">Amit Patel</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('officer.pwd@grievance.gov.in', 'Officer@123')}
              className="text-left p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs transition-colors"
            >
              <span className="font-semibold text-gov-800 block">Officer (PWD)</span>
              <span className="text-[10px] text-slate-500 block truncate">Er. Rajesh Kumar</span>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('admin@grievance.gov.in', 'Admin@123')}
              className="text-left p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs transition-colors"
            >
              <span className="font-semibold text-rose-800 block">Admin</span>
              <span className="text-[10px] text-slate-500 block truncate">Dr. Ramesh Sharma</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
