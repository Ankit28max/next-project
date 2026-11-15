import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STYLES = {
  info: { box: 'border-brand-200 bg-brand-50 text-brand-900', Icon: Info },
  success: { box: 'border-emerald-300 bg-emerald-50 text-emerald-900', Icon: CheckCircle2 },
  warning: { box: 'border-amber-300 bg-amber-50 text-amber-900', Icon: AlertTriangle },
  error: { box: 'border-red-300 bg-red-50 text-red-900', Icon: XCircle },
};

export function Alert({ variant = 'info', title, children, className }: { variant?: keyof typeof STYLES; title?: string; children?: React.ReactNode; className?: string }) {
  const { box, Icon } = STYLES[variant];
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-lg border p-4 text-sm', box, className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
