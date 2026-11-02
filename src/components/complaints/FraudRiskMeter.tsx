import React from 'react';
import { FraudRiskBadge } from '@/components/ui/badge';
import { FraudRiskLevel } from '@/types';
import { AlertCircle, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface FraudRiskMeterProps {
  score?: number | null;
  level?: FraudRiskLevel | null;
  reasons?: string[] | null;
  recommendedAction?: string | null;
  showOfficerControls?: boolean;
}

export function FraudRiskMeter({
  score = 10,
  level = 'LOW',
  reasons = [],
  recommendedAction,
  showOfficerControls = false,
}: FraudRiskMeterProps) {
  const currentScore = score ?? 10;
  const currentLevel = level ?? 'LOW';

  const getColorClasses = () => {
    if (currentLevel === 'HIGH') return { bar: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' };
    if (currentLevel === 'MEDIUM') return { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' };
    return { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' };
  };

  const colors = getColorClasses();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-gov-800" />
          <h4 className="text-sm font-semibold text-gov-900">
            Suspicious Complaint & AI Risk Analysis
          </h4>
        </div>
        <FraudRiskBadge level={currentLevel} score={currentScore} />
      </div>

      {/* Visual meter bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium text-slate-600">
          <span>Anomaly Score: {currentScore}/100</span>
          <span>Risk Level: {currentLevel}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ease-out ${colors.bar}`}
            style={{ width: `${Math.min(100, Math.max(5, currentScore))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0 (Authentic)</span>
          <span>50 (Moderate)</span>
          <span>100 (High Risk)</span>
        </div>
      </div>

      {/* Identified flags list */}
      {reasons && reasons.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Evaluation Indicators:
          </p>
          <ul className="space-y-1.5">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                {currentLevel === 'HIGH' ? (
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                ) : currentLevel === 'MEDIUM' ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                )}
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Officer Action */}
      {recommendedAction && (
        <div className={`p-3 rounded-lg text-xs ${colors.bg} ${colors.text} border border-current/10`}>
          <span className="font-semibold">Recommended Action: </span>
          {recommendedAction}
        </div>
      )}

      {/* Civic Transparency & Ethics Note */}
      <div className="text-[11px] text-slate-400 leading-tight border-t border-slate-100 pt-3">
        <strong>Academic & Civic Safeguard:</strong> This risk score is an advisory indicator to guide department officers. It does not automatically reject submissions or infer biometric data.
      </div>
    </div>
  );
}
