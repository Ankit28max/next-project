// Status is always shown as icon + text, never by colour alone.
import { AlertOctagon, AlertTriangle, ArrowUp, CheckCircle2, CircleDashed, Clock, Eye, HelpCircle, MessageCircleQuestion, RotateCcw, ShieldCheck, UserCheck, Wrench, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function Badge({ Icon, label, className }: { Icon: LucideIcon; label: string; className: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold', className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

const NEUTRAL = 'border-slate-300 bg-slate-100 text-slate-800';
const BRAND = 'border-brand-200 bg-brand-50 text-brand-800';
const GOOD = 'border-emerald-300 bg-emerald-50 text-emerald-800';
const WARN = 'border-amber-300 bg-amber-50 text-amber-900';
const BAD = 'border-red-300 bg-red-50 text-red-800';

export const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  AWAITING_CITIZEN_RESPONSE: 'Waiting for citizen',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
  REOPENED: 'Reopened',
};

const STATUS_STYLE: Record<string, { Icon: LucideIcon; className: string }> = {
  SUBMITTED: { Icon: CircleDashed, className: NEUTRAL },
  UNDER_REVIEW: { Icon: Eye, className: BRAND },
  ASSIGNED: { Icon: UserCheck, className: BRAND },
  IN_PROGRESS: { Icon: Wrench, className: BRAND },
  AWAITING_CITIZEN_RESPONSE: { Icon: MessageCircleQuestion, className: WARN },
  RESOLVED: { Icon: CheckCircle2, className: GOOD },
  REJECTED: { Icon: XCircle, className: BAD },
  REOPENED: { Icon: RotateCcw, className: WARN },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? { Icon: HelpCircle, className: NEUTRAL };
  return <Badge Icon={style.Icon} label={STATUS_LABELS[status] ?? status} className={style.className} />;
}

export function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'URGENT') return <Badge Icon={AlertOctagon} label="Urgent" className={BAD} />;
  if (priority === 'HIGH') return <Badge Icon={ArrowUp} label="High priority" className={WARN} />;
  if (priority === 'MEDIUM') return <Badge Icon={Clock} label="Medium priority" className={NEUTRAL} />;
  return <Badge Icon={Clock} label="Low priority" className={NEUTRAL} />;
}

/** Staff only. `level` is null when the analysis did not run. */
export function RiskBadge({ level, score }: { level: string | null; score: number | null }) {
  if (!level) return <Badge Icon={HelpCircle} label="Risk not assessed" className={WARN} />;
  if (level === 'HIGH') return <Badge Icon={AlertOctagon} label={`High risk (${score})`} className={BAD} />;
  if (level === 'MEDIUM') return <Badge Icon={AlertTriangle} label={`Medium risk (${score})`} className={WARN} />;
  return <Badge Icon={ShieldCheck} label={`Low risk (${score})`} className={GOOD} />;
}
