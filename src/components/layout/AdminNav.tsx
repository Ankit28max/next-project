'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Activity,
  Building2,
  FileText,
  FolderGit2,
  LayoutDashboard,
  ShieldAlert,
  Users2,
  Workflow,
} from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Admin Hub', href: '/admin', icon: LayoutDashboard },
    { label: 'All Grievances', href: '/admin/complaints', icon: FileText },
    { label: 'Departments', href: '/admin/departments', icon: Building2 },
    { label: 'Officers', href: '/admin/officers', icon: Users2 },
    { label: 'User Directory', href: '/admin/users', icon: FolderGit2 },
    { label: 'Routing Rules', href: '/admin/routing', icon: Workflow },
    { label: 'Audit Logs', href: '/admin/audit', icon: Activity },
  ];

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-gov-600 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-rose-400 font-mono bg-slate-800 px-2 py-0.5 rounded border border-rose-500/20">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Root Administrator</span>
          </div>
        </div>
      </div>
    </div>
  );
}
