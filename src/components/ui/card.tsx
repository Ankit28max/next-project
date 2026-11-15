import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6', className)} {...props} />;
}

export function CardTitle({ className, children, icon }: { className?: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <h2 className={cn('mb-4 flex items-center gap-2 text-base font-semibold text-slate-900', className)}>
      {icon}
      {children}
    </h2>
  );
}
