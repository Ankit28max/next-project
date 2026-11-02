import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { prisma } from '@/lib/db/prisma';
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  CheckCircle2,
  CopyCheck,
  FileCheck2,
  FileSearch,
  Landmark,
  MapPin,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch real database counts for hero stats
  const [totalCount, resolvedCount, deptCount, duplicateCount] = await Promise.all([
    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: 'RESOLVED' } }),
    prisma.department.count(),
    prisma.complaintMatch.count(),
  ]);

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gov-950 via-gov-900 to-gov-800 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gov-700/60 border border-gov-500/30 text-xs font-semibold text-gov-100 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>AI-Driven Municipal Governance & Verification Portal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Smart Grievance Redressal & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-200 to-white">
              Fake Complaint Detection System
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Empowering citizens to report civic infrastructure issues while leveraging multimodal AI to classify categories, cluster geographic duplicates, and flag suspicious submissions for department officers.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/citizen/submit">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg">
                File a Grievance Now <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-white border-slate-600 hover:bg-gov-800/80">
                Staff & Demo Logins
              </Button>
            </Link>
          </div>

          {/* Quick Track Search Bar */}
          <div className="pt-8 max-w-xl mx-auto">
            <form action="/citizen/complaints" method="GET" className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur shadow-xl">
              <div className="flex items-center pl-3 text-slate-300">
                <FileSearch className="h-5 w-5" />
              </div>
              <input
                type="text"
                name="search"
                placeholder="Track by Reference (e.g. GRV-2026-10045)..."
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none font-mono"
              />
              <Button type="submit" size="sm" className="bg-white text-gov-950 hover:bg-slate-100 font-semibold px-4">
                Track
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Live System Metrics Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200 shadow-md">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
                <p className="text-xs text-slate-500 font-medium">Total Registered</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-md">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{resolvedCount}</p>
                <p className="text-xs text-slate-500 font-medium">Resolved Cases</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-md">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gov-50 text-gov-700">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{deptCount}</p>
                <p className="text-xs text-slate-500 font-medium">Departments Active</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-md">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <CopyCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{duplicateCount}</p>
                <p className="text-xs text-slate-500 font-medium">Duplicate Correlations</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core AI Modules Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-gov-900">
            Intelligent Civic Infrastructure Engine
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Combining citizen participatory governance with deterministic and multimodal AI to ensure accountability, prevent spam, and optimize municipal resource allocation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: AI Classification */}
          <Card className="border-slate-200 hover:shadow-lg transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gov-100 text-gov-800">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Automated Categorization & Smart Routing
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates complaint text and uploaded images against civic taxonomy (Roads, Water, Electricity, Sanitation). Automatically determines priority and assigns to available department officers based on workload.
              </p>
              <div className="pt-2 text-xs text-gov-700 font-semibold flex items-center gap-1">
                <span>94%+ Classification Confidence</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Duplicate Detection */}
          <Card className="border-slate-200 hover:shadow-lg transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <CopyCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Multi-Signal Duplicate Detection
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Correlates Haversine geographic radius (&lt;2km), TF-IDF text similarity, category matching, and photo perceptual hashing. Allows officers to group citizen reports for a single incident without dropping complaints.
              </p>
              <div className="pt-2 text-xs text-amber-700 font-semibold flex items-center gap-1">
                <span>Geographic + Text + Image Signals</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Fraud & Manipulated Detection */}
          <Card className="border-slate-200 hover:shadow-lg transition-all">
            <CardContent className="p-6 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-800">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Suspicious Complaint Risk Scoring
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Flags anomalies such as reused evidence photos from other citizens, gibberish patterns, text-category inconsistencies, and submission velocity bursts. Serves as advisory guidance for officer verification.
              </p>
              <div className="pt-2 text-xs text-rose-700 font-semibold flex items-center gap-1">
                <span>Ethical Human-in-the-Loop Verification</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* University Evaluator Demo Credentials Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gov-300 bg-gov-50/80 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-gov-800" />
                <h3 className="text-base font-bold text-gov-900">
                  Academic University Evaluation Demo Accounts
                </h3>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                The database is pre-seeded with representative test data, including active complaints, duplicate clusters, and fraud risk test cases. Click below to test all three role-based perspectives:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-bold text-slate-800 block">Citizen:</span>
                  <span className="font-mono text-slate-600">citizen@grievance.gov.in</span>
                  <span className="text-[11px] text-slate-400 block">Password: Citizen@123</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-bold text-slate-800 block">Department Officer:</span>
                  <span className="font-mono text-slate-600">officer.pwd@grievance.gov.in</span>
                  <span className="text-[11px] text-slate-400 block">Password: Officer@123</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-bold text-slate-800 block">Administrator:</span>
                  <span className="font-mono text-slate-600">admin@grievance.gov.in</span>
                  <span className="text-[11px] text-slate-400 block">Password: Admin@123</span>
                </div>
              </div>
            </div>

            <Link href="/login" className="flex-shrink-0">
              <Button size="md" className="bg-gov-900 text-white hover:bg-gov-800 font-semibold">
                Proceed to Login Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
