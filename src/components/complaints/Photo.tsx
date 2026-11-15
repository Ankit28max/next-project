import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Complaint photo through next/image (resized and converted to a modern format on demand). */
export function Photo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={cn('relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100', className)}>
      <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" />
    </div>
  );
}
