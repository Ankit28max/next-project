import Link from 'next/link';
import { BellDot, Check } from 'lucide-react';
import { markReadAction } from '@/actions/notifications';
import { EmptyState } from '@/components/ui/empty-state';
import { SubmitButton } from '@/components/ui/submit-button';
import { formatDate } from '@/lib/utils';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  complaintId: string | null;
}

export function NotificationList({ notifications, complaintBasePath }: { notifications: NotificationItem[]; complaintBasePath: string }) {
  if (notifications.length === 0) {
    return <EmptyState title="No notifications">Updates about your complaints will appear here.</EmptyState>;
  }
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-4">
      {unread > 0 && (
        <form action={markReadAction} className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-700">{unread} unread</p>
          <SubmitButton variant="secondary">Mark all as read</SubmitButton>
        </form>
      )}
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {notifications.map((n) => (
          <li key={n.id} className={n.readAt ? 'px-4 py-4 sm:px-5' : 'border-l-4 border-brand-600 bg-brand-50 px-4 py-4 sm:px-5'}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold text-slate-900">
                  {n.readAt ? <Check className="h-4 w-4 text-slate-500" aria-hidden /> : <BellDot className="h-4 w-4 text-brand-700" aria-hidden />}
                  <span className="sr-only">{n.readAt ? 'Read: ' : 'Unread: '}</span>
                  {n.title}
                </p>
                <p className="mt-1 text-sm text-slate-700">{n.message}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatDate(n.createdAt)}
                  {n.complaintId && (
                    <>
                      {' · '}
                      <Link href={`${complaintBasePath}/${n.complaintId}`} className="link">
                        Open complaint
                      </Link>
                    </>
                  )}
                </p>
              </div>
              {!n.readAt && (
                <form action={markReadAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <SubmitButton variant="secondary">Mark as read</SubmitButton>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
