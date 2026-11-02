import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, CheckCircle2, Database, Eye, Globe2, Landmark, Lock, Scale, Shield } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gov-100 text-gov-800 text-xs font-semibold">
          <Landmark className="h-3.5 w-3.5" />
          <span>System Architecture & University Project Overview</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gov-900">
          About the Smart Grievance Redressal Portal
        </h1>
        <p className="max-w-2xl mx-auto text-sm text-slate-600 leading-relaxed">
          An engineering solution designed to eliminate delays, duplicates, and fraud in civic grievance reporting through transparent, explainable multimodal AI.
        </p>
      </div>

      {/* Project Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-gov-800 font-bold text-base">
              <Scale className="h-5 w-5" />
              <h3>The Civic Governance Challenge</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Municipal portals receive thousands of civic complaints weekly. Traditional systems suffer from three major bottlenecks:
            </p>
            <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
              <li>Manual routing delays when citizens choose the wrong department.</li>
              <li>Duplicate fatigue: Hundreds of independent citizens reporting the same pothole or water leak, causing fragmented officer response.</li>
              <li>Spam, stock photos, and test submissions that drain municipal fieldwork resources.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
              <CheckCircle2 className="h-5 w-5" />
              <h3>Our Architectural Solution</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              JanSetu introduces an automated three-pillar verification pipeline:
            </p>
            <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
              <li><strong>Taxonomy Classification:</strong> Analyzes text & photo semantics to determine priority and department jurisdiction.</li>
              <li><strong>Multi-Signal Duplicate Clustering:</strong> Combines spatial Haversine distance, text similarity, and image hash signatures.</li>
              <li><strong>Risk Assessment:</strong> Computes suspicious submission indicators for officer verification without automated penalization.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Ethical Safeguards */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        <h2 className="text-xl font-bold text-gov-900 flex items-center gap-2">
          <Shield className="h-5 w-5 text-gov-700" />
          <span>Ethics, Privacy & Academic Design Safeguards</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-600">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-gov-600" /> Zero Facial Biometrics
            </h4>
            <p className="leading-relaxed">
              The AI models only analyze civic infrastructure objects (roads, pipes, lights). We do not run facial recognition, infer personal demographics, or store biometric signatures.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Brain className="h-4 w-4 text-amber-600" /> Human-in-the-Loop
            </h4>
            <p className="leading-relaxed">
              AI outputs (fraud risk scores, duplicate percentages) serve as advisory indicators for municipal officers. No complaint is automatically rejected or deleted by the algorithm.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-emerald-600" /> Data Privacy & Role Scoping
            </h4>
            <p className="leading-relaxed">
              Citizens can only view their own grievances. Internal officer remarks and sensitive fraud telemetry are strictly scoped to department staff and administrators.
            </p>
          </div>
        </div>
      </div>

      {/* Project Metadata */}
      <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-2">
        <p className="font-semibold text-slate-800">Academic Project Submission Information:</p>
        <p><strong>System:</strong> Smart Grievance Redressal & Fake Complaint Detection System (JanSetu)</p>
        <p><strong>Stack:</strong> Next.js App Router (TypeScript), Prisma ORM, PostgreSQL, Tailwind CSS, Leaflet OpenStreetMap, Multimodal AI Engine</p>
        <p><strong>Verification Mode:</strong> Dual Provider (Zero-Cost Deterministic Academic Provider & Google Gemini Multimodal Vision)</p>
      </div>
    </div>
  );
}
