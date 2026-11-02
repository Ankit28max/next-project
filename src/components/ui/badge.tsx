import * as React from 'react';
import { cn } from '@/lib/utils';
import { ComplaintStatus, FraudRiskLevel, Priority } from '@/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'purple';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    secondary: 'bg-gov-100 text-gov-800 border-gov-200',
    outline: 'border border-slate-300 text-slate-700 bg-transparent',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  switch (status) {
    case 'SUBMITTED':
      return <Badge variant="secondary">Submitted</Badge>;
    case 'UNDER_REVIEW':
      return <Badge variant="warning">Under Review</Badge>;
    case 'ASSIGNED':
      return <Badge variant="info">Assigned</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="purple">In Progress</Badge>;
    case 'AWAITING_CITIZEN_RESPONSE':
      return <Badge variant="warning">Action Needed</Badge>;
    case 'RESOLVED':
      return <Badge variant="success">Resolved</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">Rejected</Badge>;
    case 'REOPENED':
      return <Badge variant="outline">Reopened</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  switch (priority) {
    case 'URGENT':
      return <Badge variant="danger" className="font-semibold animate-pulse">Urgent</Badge>;
    case 'HIGH':
      return <Badge variant="danger">High</Badge>;
    case 'MEDIUM':
      return <Badge variant="warning">Medium</Badge>;
    case 'LOW':
      return <Badge variant="default">Low</Badge>;
    default:
      return <Badge>{priority}</Badge>;
  }
}

export function FraudRiskBadge({ level, score }: { level?: FraudRiskLevel | null; score?: number | null }) {
  if (!level) return null;

  switch (level) {
    case 'HIGH':
      return (
        <Badge variant="danger" className="bg-rose-100 text-rose-800 border-rose-300 font-semibold">
          High Risk ({score ?? 0}%)
        </Badge>
      );
    case 'MEDIUM':
      return (
        <Badge variant="warning" className="bg-amber-100 text-amber-800 border-amber-300">
          Medium Risk ({score ?? 0}%)
        </Badge>
      );
    case 'LOW':
      return (
        <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-300">
          Low Risk ({score ?? 0}%)
        </Badge>
      );
    default:
      return null;
  }
}
