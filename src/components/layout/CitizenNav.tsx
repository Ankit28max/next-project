'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Bell, FilePlus2, LayoutDashboard, ListFilter, User } from 'lucide-react';

export function CitizenNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/citizen', icon: LayoutDashboard },
    { label: 'File Grievance', href: '/citizen/submit', icon: FilePlus2, highlight: true },
    { label: 'My Grievances', href: '/citizen/complaints', icon: ListFilter },
    { label: 'Notifications', href: '/citizen/notifications', icon: Bell },
    { label: 'Profile', href: '/citizen/profile', icon: User },
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto py-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/citizen'
                ? pathname === '/citizen'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-gov-900 text-white shadow-xs'
                    : item.highlight
                    ? 'bg-gov-50 text-gov-800 border border-gov-300 hover:bg-gov-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
