import React from 'react';
import Link from 'next/link';
import { CopyCheck, ExternalLink, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface DuplicateMatchItem {
  id?: string;
  matchedComplaintId: string;
  referenceNumber?: string;
  title?: string;
  combinedScore: number;
  textSimilarity?: number;
  imageSimilarity?: number;
  geographicDistanceKm?: number;
  matchReason?: string;
  createdAt?: string;
}

interface DuplicateMatchCardProps {
  matches: DuplicateMatchItem[];
  basePath?: string;
}

export function DuplicateMatchCard({ matches, basePath = '/officer/complaints' }: DuplicateMatchCardProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
        <CopyCheck className="mx-auto h-8 w-8 text-emerald-500 mb-2 opacity-80" />
        <h4 className="text-sm font-semibold text-slate-800">No Duplicate Complaints Found</h4>
        <p className="text-xs text-slate-500 mt-1">
          Multi-signal analysis confirms this appears to be a unique grievance.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CopyCheck className="h-5 w-5 text-amber-700" />
          <h4 className="text-sm font-semibold text-slate-900">
            Potential Duplicate Grievances Detected ({matches.length})
          </h4>
        </div>
        <Badge variant="warning">
          Highest Similarity: {Math.round(matches[0].combinedScore * 100)}%
        </Badge>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Multiple citizens may report the same civic incident. Review potential matching complaints to consolidate field dispatch actions:
      </p>

      <div className="space-y-3">
        {matches.map((match, idx) => (
          <div
            key={match.matchedComplaintId || idx}
            className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm space-y-2 hover:border-gov-400 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-gov-800 bg-gov-50 px-2 py-0.5 rounded">
                {match.referenceNumber || 'Existing Complaint'}
              </span>
              <span className="text-xs font-bold text-amber-700">
                Match Score: {Math.round(match.combinedScore * 100)}%
              </span>
            </div>

            {match.title && (
              <h5 className="text-xs font-medium text-slate-800 line-clamp-1">{match.title}</h5>
            )}

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              {match.geographicDistanceKm != null && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  {match.geographicDistanceKm < 1
                    ? `${Math.round(match.geographicDistanceKm * 1000)} meters away`
                    : `${match.geographicDistanceKm.toFixed(2)} km away`}
                </span>
              )}
              {match.textSimilarity != null && (
                <span>Text Sim: {Math.round(match.textSimilarity * 100)}%</span>
              )}
              {match.imageSimilarity != null && match.imageSimilarity > 0 && (
                <span className="text-gov-700 font-medium">
                  Image Sim: {Math.round(match.imageSimilarity * 100)}%
                </span>
              )}
            </div>

            {match.matchReason && (
              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded leading-tight">
                <strong>Signals:</strong> {match.matchReason}
              </p>
            )}

            <div className="pt-1 flex justify-end">
              <Link
                href={`${basePath}/${match.matchedComplaintId}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-gov-700 hover:text-gov-900 hover:underline"
              >
                Inspect Matched Case <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
