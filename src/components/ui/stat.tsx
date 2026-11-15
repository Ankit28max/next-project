import Link from 'next/link';

export function StatGrid({ items }: { items: { label: string; value: number; href?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4">
          <dt className="text-sm text-slate-600">{item.label}</dt>
          <dd className="mt-1 text-2xl font-bold">
            {item.href ? (
              <Link href={item.href} className="text-brand-800 underline">
                {item.value}
              </Link>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A simple horizontal bar chart made of plain HTML, so it needs no chart library. */
export function BarList({ rows, emptyText }: { rows: { label: string; value: number }[]; emptyText: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-slate-600">{emptyText}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-slate-800">{row.label}</span>
            <span className="font-semibold">{row.value}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-100" aria-hidden>
            <div className="h-2 rounded-full bg-brand-600" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
