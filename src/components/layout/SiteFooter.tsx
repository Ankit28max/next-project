import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="font-medium text-slate-800">Academic project, not affiliated with any government body.</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/how-it-works" className="link">
            How it works
          </Link>
          <Link href="/privacy" className="link">
            Privacy
          </Link>
          <Link href="/about" className="link">
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
