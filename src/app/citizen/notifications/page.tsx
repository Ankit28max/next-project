import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Bell, CheckCheck, Clock, ExternalLink, Inbox } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    include: {
      complaint: { select: { id: true, referenceNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gov-900">Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status updates and department communications.
          </p>
        </div>

        {notifications.length > 0 && (
          <form action="/api/notifications" method="PATCH">
            <Button type="button" variant="outline" size="sm" className="text-xs">
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark All as Read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-slate-200 p-8 text-center bg-white">
          <Inbox className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No notifications yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            You will receive instant alerts here when officers update your grievances.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all ${
                n.readAt
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-blue-50/50 border-blue-200 text-slate-900 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      {n.title}
                    </span>
                    {!n.readAt && (
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(n.createdAt)}</span>
                  </div>
                </div>

                {n.complaint && (
                  <Link href={`/citizen/complaints/${n.complaint.id}`}>
                    <Button variant="outline" size="sm" className="text-xs bg-white">
                      Track <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
