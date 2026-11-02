import React from 'react';
import Link from 'next/link';
import { Landmark, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gov-700">
                <Landmark className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">JanSetu Grievance Portal</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              An intelligent, transparent civic grievance redressal framework powered by automated multi-signal duplicate detection, AI category classification, and human-in-the-loop fraud risk verification.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Built for Academic University Project Demonstration & Civic Research</span>
            </div>
          </div>

          {/* Column 2: Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Access Portals</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/citizen" className="hover:text-white transition-colors">
                  Citizen Grievance Submission
                </Link>
              </li>
              <li>
                <Link href="/officer" className="hover:text-white transition-colors">
                  Department Officer Workspace
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Administrator Analytics Center
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Staff & Demo Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Framework & Ethics</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  System Architecture
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  Duplicate & Fraud Detection Model
                </Link>
              </li>
              <li>
                <span className="text-xs text-slate-500">
                  Data Privacy: Zero biometric retention; algorithmic risk scores serve purely as officer guidance.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Smart Grievance Redressal System. University Capstone Project.</p>
          <p>Powered by Next.js, Prisma, PostgreSQL & Multimodal AI</p>
        </div>
      </div>
    </footer>
  );
}
