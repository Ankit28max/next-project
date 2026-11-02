import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Activity, ShieldAlert, Terminal } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    include: {
      actor: { select: { name: true, role: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gov-900">Immutable Audit Trail ({logs.length})</h1>
        <p className="text-xs text-slate-500 mt-1">
          Cryptographically recorded timeline of administrative operations, complaint transitions, and security events.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">Event Metadata</th>
                <th className="p-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                    {formatDate(log.createdAt)}
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                  </td>

                  <td className="p-3.5 whitespace-nowrap">
                    {log.actor ? (
                      <div>
                        <span className="font-semibold text-slate-800 block">{log.actor.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.actor.email} ({log.actor.role})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">System Automated</span>
                    )}
                  </td>

                  <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-700">
                    {log.entityType}
                    {log.entityId && (
                      <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                        {log.entityId}
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 max-w-xs font-mono text-[11px] text-slate-600">
                    {log.metadata ? (
                      <pre className="bg-slate-50 p-1.5 rounded border border-slate-200 text-[10px] overflow-x-auto max-h-16">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
