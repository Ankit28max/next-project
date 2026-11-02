import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  BrainCircuit,
  Camera,
  CheckCircle2,
  CopyCheck,
  FileSpreadsheet,
  MapPin,
  RefreshCw,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      step: '01',
      title: 'Citizen Submission & Evidence Capture',
      desc: 'Citizen enters complaint details, uploads photo evidence (validated for MIME type & size), and pinpoints the incident on an interactive Leaflet map or via GPS coordinates.',
      icon: Camera,
    },
    {
      step: '02',
      title: 'AI Classification & Priority Analysis',
      desc: 'The AI service inspects linguistic markers and image context to predict the civic category (Roads, Water, Electricity, Sanitation), calculate a confidence score, and suggest priority.',
      icon: BrainCircuit,
    },
    {
      step: '03',
      title: 'Multi-Signal Duplicate Detection',
      desc: 'The engine queries existing active complaints within a 2km Haversine radius, compares description text similarity (TF-IDF tokens), matching category, and photo hashes to compute a duplicate score.',
      icon: CopyCheck,
    },
    {
      step: '04',
      title: 'Fraud & Suspicious Anomaly Scoring',
      desc: 'Evaluates risk indicators: reused photo hashes from different citizens, keyboard-smash/spam text patterns, category mismatch, and rapid-fire submission velocity bursts (0-100 score).',
      icon: ShieldAlert,
    },
    {
      step: '05',
      title: 'Department Routing & Workload Balancing',
      desc: 'Routes to the responsible department (PWD, Water, Health, Electricity) and assigns to the officer with the lowest active workload for balanced distribution.',
      icon: UserCheck,
    },
    {
      step: '06',
      title: 'Officer Action & Public Redressal',
      desc: 'Department officers inspect evidence, review duplicate links, update status (Assigned -> In Progress -> Resolved), and publish resolution remarks visible to the citizen.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gov-900">
          How the JanSetu Redressal Pipeline Works
        </h1>
        <p className="max-w-2xl mx-auto text-sm text-slate-600 leading-relaxed">
          An explainable, step-by-step workflow from citizen submission to automated AI triage and field resolution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gov-100 text-gov-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-2xl font-bold text-slate-200">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Duplicate detection formula illustration */}
      <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-4">
        <h3 className="text-base font-bold text-amber-950 flex items-center gap-2">
          <CopyCheck className="h-5 w-5 text-amber-700" />
          <span>Duplicate Detection Pipeline Formula</span>
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          Our duplicate detection algorithm avoids naive single-variable matching by computing a weighted multi-signal score:
        </p>
        <div className="p-3 bg-white rounded-lg border border-amber-200 font-mono text-xs text-slate-800 overflow-x-auto">
          Combined Score = (0.35 × TextSim) + (0.35 × GeoSim) + (0.15 × CategoryMatch) + (0.15 × ImageSim) × TemporalDecayFactor
        </div>
        <p className="text-xs text-slate-600">
          Where <strong>GeoSim</strong> uses the Haversine great-circle formula over WGS84 coordinates, and <strong>TemporalDecayFactor</strong> scales proximity over a 60-day window.
        </p>
      </div>
    </div>
  );
}
