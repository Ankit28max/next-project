import React from 'react';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/badge';
import { ComplaintStatus } from '@/types';
import { CheckCircle2, CircleDot } from 'lucide-react';

export interface StatusHistoryItem {
  id: string;
  previousStatus: ComplaintStatus;
  newStatus: ComplaintStatus;
  remarks?: string | null;
  createdAt: string | Date;
  actor?: {
    name: string;
    role: string;
  } | null;
}

interface StatusTimelineProps {
  history: StatusHistoryItem[];
  currentStatus: ComplaintStatus;
}

export function StatusTimeline({ history, currentStatus }: StatusTimelineProps) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-slate-500 italic">No status history recorded yet.</p>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {history.map((entry, index) => {
        const isLatest = index === history.length - 1;

        return (
          <div key={entry.id || index} className="relative group">
            {/* Timeline icon node */}
            <span
              className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-white ${
                isLatest ? 'text-gov-800' : 'text-slate-400'
              }`}
            >
              {isLatest ? (
                <CircleDot className="h-5 w-5 text-gov-800 animate-pulse" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              )}
            </span>

            {/* Timeline item content */}
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-4 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <StatusBadge status={entry.newStatus} />
                  {entry.actor?.name && (
                    <span className="text-xs text-slate-600 font-medium">
                      by {entry.actor.name} ({entry.actor.role})
                    </span>
                  )}
                </div>
                <time className="text-xs text-slate-400 font-mono">
                  {formatDate(entry.createdAt)}
                </time>
              </div>

              {entry.remarks && (
                <p className="text-sm text-slate-700 leading-relaxed mt-1">
                  {entry.remarks}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
