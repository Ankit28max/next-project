import type { Metadata } from 'next';
import { requireRolePage } from '@/lib/auth/session';
import { StaffComplaintView } from '@/components/complaints/StaffComplaintView';

export const metadata: Metadata = { title: 'Review complaint' };

export default async function OfficerComplaintPage({ params, searchParams }: { params: { id: string }; searchParams: { notice?: string } }) {
  const user = await requireRolePage('OFFICER');
  return <StaffComplaintView id={params.id} user={user} basePath="/officer/complaints" notice={searchParams.notice} />;
}
