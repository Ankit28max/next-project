import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="page max-w-xl text-center">
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-2">Page not found</h1>
      <p className="mt-3 text-slate-700">The page does not exist, or you do not have access to it.</p>
      <Link href="/" className={buttonClass('primary', 'mt-6')}>
        Go to the home page
      </Link>
    </div>
  );
}
