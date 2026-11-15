import type { Metadata } from 'next';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';

export const metadata: Metadata = { title: 'Audit log' };

const PAGE_SIZE = 25;
const pageSchema = z.coerce.number().int().min(1).max(10_000).catch(1);

export default async function AuditPage({ searchParams }: { searchParams: { page?: string } }) {
  await requireRolePage('ADMIN');
  const page = pageSchema.parse(searchParams.page);
  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      select: { id: true, action: true, entityType: true, entityId: true, createdAt: true, actor: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1>Audit log</h1>
        <p className="mt-1 text-slate-700">Who did what, newest first. Entries cannot be edited from the application.</p>
      </div>
      {logs.length === 0 ? (
        <EmptyState title="Nothing logged yet" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">Audit log entries</caption>
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">When</th>
                <th scope="col" className="px-4 py-3 font-semibold">Who</th>
                <th scope="col" className="px-4 py-3 font-semibold">Action</th>
                <th scope="col" className="px-4 py-3 font-semibold">On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3">{log.actor ? `${log.actor.name} (${log.actor.role.toLowerCase()})` : 'Unknown or system'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {log.entityType}
                    {log.entityId && <span className="ml-1 font-mono text-xs text-slate-600">{log.entityId.slice(-8)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} basePath="/admin/audit" params={{}} />
    </div>
  );
}
