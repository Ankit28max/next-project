import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { REFERENCE_PATTERN } from '@/lib/complaints/reference';
import { clientIp } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { formatDate } from '@/lib/utils';
import { Alert } from '@/components/ui/alert';
import { StatusBadge } from '@/components/ui/badges';
import { buttonClass } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Track a complaint' };

// Public page: deliberately exposes only status, category, department and dates.
// No title, description, address, photo or names.
async function lookup(ref: string) {
  return prisma.complaint.findUnique({
    where: { referenceNumber: ref },
    select: {
      referenceNumber: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true } },
      department: { select: { name: true } },
    },
  });
}

export default async function TrackPage({ searchParams }: { searchParams: { ref?: string } }) {
  const ref = (searchParams.ref ?? '').trim().toUpperCase();
  const valid = REFERENCE_PATTERN.test(ref);
  const allowed = !ref || rateLimit(`track:${clientIp({ headers: headers() })}`, 30, 60 * 1000);
  const complaint = ref && valid && allowed ? await lookup(ref) : null;

  return (
    <div className="page max-w-xl">
      <h1>Track a complaint</h1>
      <p className="mt-2 text-slate-700">Enter your reference number to see the current status.</p>

      <form method="GET" className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="ref" className="sr-only">
          Reference number
        </label>
        <input
          id="ref"
          name="ref"
          defaultValue={ref}
          required
          placeholder="JS-2026-ABC234"
          autoComplete="off"
          className="min-h-[2.75rem] w-full rounded-lg border border-slate-400 px-3 font-mono text-base uppercase placeholder:normal-case placeholder:text-slate-500"
        />
        <button type="submit" className={buttonClass('primary')}>
          Track
        </button>
      </form>

      <div className="mt-6" aria-live="polite">
        {!allowed && <Alert variant="warning">Too many lookups. Please wait a minute and try again.</Alert>}
        {allowed && ref && !complaint && (
          <Alert variant="warning" title="No complaint found">
            Check the reference number. It looks like JS-2026-ABC234.
          </Alert>
        )}
        {complaint && (
          <Card>
            <p className="font-mono text-lg font-semibold">{complaint.referenceNumber}</p>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="text-slate-600">Status</dt>
              <dd>
                <StatusBadge status={complaint.status} />
              </dd>
              <dt className="text-slate-600">Category</dt>
              <dd>{complaint.category?.name ?? 'Not yet categorised'}</dd>
              <dt className="text-slate-600">Department</dt>
              <dd>{complaint.department?.name ?? 'Waiting to be assigned'}</dd>
              <dt className="text-slate-600">Submitted</dt>
              <dd>{formatDate(complaint.createdAt)}</dd>
              <dt className="text-slate-600">Last update</dt>
              <dd>{formatDate(complaint.updatedAt)}</dd>
            </dl>
            <p className="mt-4 text-sm text-slate-600">Sign in to see the full history and officer remarks.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
