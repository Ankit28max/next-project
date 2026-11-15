'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface AreaNavItem {
  href: string;
  label: string;
  badge?: number;
}

/** Secondary navigation for the citizen / officer / admin areas. */
export function AreaNav({ title, items }: { title: string; items: AreaNavItem[] }) {
  const pathname = usePathname();
  const root = items[0].href;
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-page items-center gap-4 px-4 sm:px-6">
        <span className="hidden shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500 md:block">{title}</span>
        <nav aria-label={title} className="-mb-px flex gap-1 overflow-x-auto">
          {items.map((item) => {
            const active = item.href === root ? pathname === root : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium no-underline',
                  active ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
                )}
              >
                {item.label}
                {item.badge ? (
                  <span className="rounded-full bg-brand-700 px-1.5 text-xs font-semibold text-white">
                    {item.badge}
                    <span className="sr-only"> unread</span>
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
