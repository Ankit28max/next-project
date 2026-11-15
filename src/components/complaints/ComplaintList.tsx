import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PriorityBadge, RiskBadge, StatusBadge } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';

export interface ComplaintListItem {
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
  category: { name: string } | null;
  department?: { name: string } | null;
  // Staff-only fields. Citizens' lists never include them.
  fraudRiskLevel?: string | null;
  fraudRiskScore?: number | null;
  needsManualTriage?: boolean;
  matchCount?: number;
}

/** One list for all three roles. `basePath` decides where a row links to. */
export function ComplaintList({ items, basePath, showRisk = false }: { items: ComplaintListItem[]; basePath: string; showRisk?: boolean }) {
  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {items.map((c) => (
        <li key={c.id}>
          <Link href={`${basePath}/${c.id}`} className="flex items-center gap-3 px-4 py-4 no-underline hover:bg-slate-50 sm:px-5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{c.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">
                <span className="font-mono">{c.referenceNumber}</span> · {c.category?.name ?? 'Uncategorised'}
                {c.department !== undefined && <> · {c.department?.name ?? 'No department'}</>} · {formatDate(c.createdAt)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={c.status} />
                <PriorityBadge priority={c.priority} />
                {showRisk && <RiskBadge level={c.fraudRiskLevel ?? null} score={c.fraudRiskScore ?? null} />}
                {showRisk && c.matchCount ? (
                  <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                    {c.matchCount} possible duplicate{c.matchCount > 1 ? 's' : ''}
                  </span>
                ) : null}
                {showRisk && c.needsManualTriage && (
                  <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                    Needs manual triage
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
