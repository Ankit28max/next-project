import { CheckCircle2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

interface Props {
  referenceNumber: string;
  categoryName: string | null;
  departmentName: string | null;
  analysedBy: string;
  similarComplaints: number;
  needsManualTriage: boolean;
}

/** Result screen shown once, right after a complaint is submitted. */
export function SubmittedCard({ referenceNumber, categoryName, departmentName, analysedBy, similarComplaints, needsManualTriage }: Props) {
  return (
    <Card className="border-emerald-300 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
      <h2 className="mt-3 text-xl" role="status">
        Complaint submitted
      </h2>
      <p className="mt-4 text-sm text-slate-600">Your reference number</p>
      <p className="mt-1 inline-block rounded-lg border-2 border-dashed border-brand-300 bg-brand-50 px-5 py-3 font-mono text-2xl font-bold tracking-wide text-brand-900">
        {referenceNumber}
      </p>
      <p className="mt-2 text-sm text-slate-600">Keep it. Anyone with this number can check the status on the Track page.</p>

      <dl className="mx-auto mt-6 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-left text-sm">
        <dt className="text-slate-600">Category</dt>
        <dd className="font-medium">{categoryName ?? 'To be decided by staff'}</dd>
        <dt className="text-slate-600">Sent to</dt>
        <dd className="font-medium">{departmentName ?? 'Waiting for manual assignment'}</dd>
        <dt className="text-slate-600">Sorted by</dt>
        <dd className="font-medium">
          {analysedBy === 'gemini' && 'Vision model and keyword rules'}
          {analysedBy === 'rules' && 'Keyword rules (vision model not used)'}
          {analysedBy === 'none' && 'Not sorted automatically'}
        </dd>
      </dl>

      {similarComplaints > 0 && (
        <Alert variant="info" className="mt-5 text-left">
          Similar complaints were already reported nearby. Yours is still registered; an officer will look at them together.
        </Alert>
      )}
      {needsManualTriage && (
        <Alert variant="warning" className="mt-5 text-left">
          The automatic sorting could not be completed, so a staff member will assign your complaint by hand.
        </Alert>
      )}
    </Card>
  );
}
