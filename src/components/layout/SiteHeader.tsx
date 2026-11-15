import Link from 'next/link';
import { Waypoints } from 'lucide-react';
import { AuthLinks } from './AuthLinks';

// Contains no user data, so pages that use it can still be rendered statically.
// The signed-in state is filled in by the small client component <AuthLinks />.
export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-white">
            <Waypoints className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">JanSetu</span>
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium text-slate-700">
          <Link href="/how-it-works" className="py-2 no-underline hover:text-brand-700">
            How it works
          </Link>
          <Link href="/track" className="py-2 no-underline hover:text-brand-700">
            Track
          </Link>
          <Link href="/about" className="py-2 no-underline hover:text-brand-700">
            About
          </Link>
          <AuthLinks />
        </nav>
      </div>
    </header>
  );
}
