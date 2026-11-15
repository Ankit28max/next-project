'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { buttonClass } from '@/components/ui/button';

const HOME: Record<string, string> = { CITIZEN: '/citizen', OFFICER: '/officer', ADMIN: '/admin' };

export function AuthLinks() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null | undefined>(undefined);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, [pathname]);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  }

  if (user === undefined) return <span className="h-11 w-24" aria-hidden />;
  if (!user) {
    return (
      <>
        <Link href="/login" className="py-2 no-underline hover:text-brand-700">
          Sign in
        </Link>
        <Link href="/register" className={buttonClass('primary')}>
          Register
        </Link>
      </>
    );
  }
  return (
    <>
      <Link href={HOME[user.role] ?? '/'} className="py-2 font-semibold text-brand-700 no-underline hover:text-brand-900">
        My dashboard
      </Link>
      <button type="button" onClick={signOut} className={buttonClass('secondary')}>
        Sign out
      </button>
    </>
  );
}
