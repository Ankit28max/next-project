import Link from 'next/link';
import { Camera, GitCompareArrows, Route, ScanSearch, Search, UserCheck } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { buttonClass } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Incremental Static Regeneration: this page is built as static HTML and
// rebuilt in the background at most once every 5 minutes, so the counts stay
// fresh without a database query on every visit.
export const revalidate = 300;

async function getCounts() {
  try {
    const [total, resolved, departments] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'RESOLVED' } }),
      prisma.department.count(),
    ]);
    return { total, resolved, departments };
  } catch {
    return null; // database unreachable at build time: the page still renders
  }
}

const STEPS = [
  { Icon: Camera, title: 'You report', text: 'Describe the problem, pin the exact spot on the map and attach one photo.' },
  { Icon: ScanSearch, title: 'The system analyses', text: 'It suggests a category, looks for similar complaints nearby and notes anything unusual about the photo.' },
  { Icon: Route, title: 'It is routed', text: 'The complaint goes to the responsible department and to the officer with the fewest open cases.' },
  { Icon: UserCheck, title: 'An officer decides', text: 'A human officer reviews everything and updates the status. You can follow it with your reference number.' },
];

export default async function HomePage() {
  const counts = await getCounts();

  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="page grid gap-10 py-12 sm:py-16 lg:grid-cols-5 lg:items-center">
          <div className="lg:col-span-3">
            <h1 className="text-3xl font-bold sm:text-4xl">Report a civic problem. Follow it until it is fixed.</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-700">
              JanSetu is a grievance portal for potholes, garbage, water, drainage and streetlight problems. Software helps sort
              and route complaints. Decisions are always made by a human officer.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/citizen/submit" className={buttonClass('primary')}>
                Report a problem
              </Link>
              <Link href="/how-it-works" className={buttonClass('secondary')}>
                How it works
              </Link>
            </div>
          </div>

          <Card className="lg:col-span-2">
            <h2 className="flex items-center gap-2">
              <Search className="h-5 w-5 text-brand-700" aria-hidden />
              Track a complaint
            </h2>
            <p className="mt-1 text-sm text-slate-600">Enter the reference number you received. No sign-in needed.</p>
            <form action="/track" method="GET" className="mt-4 flex flex-col gap-3 sm:flex-row">
              <label htmlFor="ref" className="sr-only">
                Reference number
              </label>
              <input
                id="ref"
                name="ref"
                required
                placeholder="JS-2026-ABC234"
                autoComplete="off"
                className="min-h-[2.75rem] w-full rounded-lg border border-slate-400 px-3 font-mono text-base uppercase placeholder:normal-case placeholder:text-slate-500"
              />
              <button type="submit" className={buttonClass('primary')}>
                Track
              </button>
            </form>
          </Card>
        </div>
      </section>

      <section className="page" aria-labelledby="how">
        <h2 id="how" className="text-xl">
          How it works
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ Icon, title, text }, index) => (
            <li key={title}>
              <Card className="h-full">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 font-semibold text-slate-900">
                  {index + 1}. {title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="page pt-0" aria-labelledby="honest">
        <Card>
          <h2 id="honest" className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-brand-700" aria-hidden />
            What the software does, and does not do
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            <li>It suggests a category from keywords and, when a vision model is configured, from the photo.</li>
            <li>It compares new complaints with recent ones nearby (text, distance, category and photo fingerprint) and links likely duplicates for the officer.</li>
            <li>It gives officers a risk score with written reasons, for example a photo that was already used by someone else.</li>
            <li>
              <strong>It never rejects a complaint.</strong> Scores are advice for a human officer, and they can be wrong.
            </li>
          </ul>
          <p className="mt-4">
            <Link href="/how-it-works" className="link">
              Read the details
            </Link>
          </p>
        </Card>

        {counts && (
          <dl className="mt-6 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Complaints received', value: counts.total },
              { label: 'Resolved', value: counts.resolved },
              { label: 'Departments', value: counts.departments },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4">
                <dd className="text-2xl font-bold text-slate-900">{item.value}</dd>
                <dt className="mt-1 text-sm text-slate-600">{item.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </section>
    </>
  );
}
