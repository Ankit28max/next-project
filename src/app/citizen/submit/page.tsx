import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { SubmitWizard } from './SubmitWizard';

export const metadata: Metadata = { title: 'Report a problem' };

export default async function SubmitPage() {
  await requireRolePage('CITIZEN');
  const categories = await prisma.complaintCategory.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return (
    <div className="mx-auto max-w-2xl">
      <h1>Report a problem</h1>
      <SubmitWizard categories={categories} />
    </div>
  );
}
