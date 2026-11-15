import Link from 'next/link';
import { buttonClass } from './button';

/** Previous / next links that keep the current filters in the URL. */
export function Pagination({ page, pageSize, total, basePath, params }: { page: number; pageSize: number; total: number; basePath: string; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => value && query.set(key, value));
    query.set('page', String(p));
    return `${basePath}?${query}`;
  };
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-2 text-sm text-slate-700">
      <span>
        Page {page} of {pages} ({total} total)
      </span>
      <span className="flex gap-2">
        {page > 1 && (
          <Link href={href(page - 1)} className={buttonClass('secondary')}>
            Previous
          </Link>
        )}
        {page < pages && (
          <Link href={href(page + 1)} className={buttonClass('secondary')}>
            Next
          </Link>
        )}
      </span>
    </nav>
  );
}
