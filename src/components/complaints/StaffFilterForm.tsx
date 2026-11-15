import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { STATUS_LABELS } from '@/components/ui/badges';
import type { StaffFilters } from './staff-list';

/** A plain GET form: filters live in the URL, so they work without JavaScript and can be bookmarked. */
export function StaffFilterForm({ filters, basePath, departments, showMine = false }: { filters: StaffFilters; basePath: string; departments?: { id: string; name: string }[]; showMine?: boolean }) {
  return (
    <form method="GET" className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Input label="Search" name="q" defaultValue={filters.q} placeholder="Reference or title" />
      <Select label="Status" name="status" defaultValue={filters.status ?? ''}>
        <option value="">Any status</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Select label="Risk level" name="risk" defaultValue={filters.risk ?? ''}>
        <option value="">Any risk</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </Select>
      {departments && (
        <Select label="Department" name="department" defaultValue={filters.department ?? ''}>
          <option value="">Any department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      )}
      {showMine && (
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-medium text-slate-800">
          <input type="checkbox" name="mine" value="1" defaultChecked={filters.mine === '1'} className="h-5 w-5 accent-brand-700" />
          Assigned to me only
        </label>
      )}
      {departments && (
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-medium text-slate-800">
          <input type="checkbox" name="triage" value="1" defaultChecked={filters.triage === '1'} className="h-5 w-5 accent-brand-700" />
          Needs manual triage only
        </label>
      )}
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <button type="submit" className={buttonClass('primary')}>
          Apply filters
        </button>
        <Link href={basePath} className={buttonClass('ghost')}>
          Clear
        </Link>
      </div>
    </form>
  );
}
