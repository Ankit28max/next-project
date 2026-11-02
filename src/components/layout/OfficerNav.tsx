'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BarChart3, CheckSquare, Inbox, ShieldAlert } from 'lucide-react';

export function OfficerNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Officer Dashboard', href: '/officer', icon: Inbox },
    { label: 'Assigned Complaints Queue', href: '/officer/complaints', icon: CheckSquare },
    { label: 'Department Workload', href: '/officer/workload', icon: BarChart3 },
  ];

  return (
    <div className="bg-gov-950 text-white border-b border-gov-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/officer'
                  ? pathname === '/officer'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-gov-800 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-gov-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-400 font-mono bg-gov-900 px-2.5 py-1 rounded border border-amber-500/20">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Official Redressal Workspace</span>
          </div>
        </div>
      </div>
    </div>
  );
}
