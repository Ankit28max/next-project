import { Lock } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';

export interface TimelineEntry {
  id: string;
  newStatus: string;
  remarks: string | null;
  isInternal: boolean;
  createdAt: Date;
  actor: { name: string; role: string } | null;
}

const ROLE_LABEL: Record<string, string> = { CITIZEN: 'Citizen', OFFICER: 'Officer', ADMIN: 'Administrator' };

export function StatusTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <p className="text-sm text-slate-600">No history yet.</p>;
  return (
    <ol className="space-y-4 border-l-2 border-slate-200 pl-5">
      {entries.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute -left-[1.7rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-600" aria-hidden />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {entry.isInternal ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                <Lock className="h-3.5 w-3.5" aria-hidden />
                Internal note
              </span>
            ) : (
              <StatusBadge status={entry.newStatus} />
            )}
            <time className="text-sm text-slate-600">{formatDate(entry.createdAt)}</time>
          </div>
          {entry.remarks && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-800">{entry.remarks}</p>}
          <p className="mt-0.5 text-sm text-slate-600">
            {entry.actor ? `${ROLE_LABEL[entry.actor.role] ?? 'User'}: ${entry.actor.name}` : 'Automatic'}
          </p>
        </li>
      ))}
    </ol>
  );
}
