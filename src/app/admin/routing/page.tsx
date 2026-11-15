import type { Metadata } from 'next';
import { setRoutingRuleActiveAction } from '@/actions/admin';
import { prisma } from '@/lib/db/prisma';
import { requireRolePage } from '@/lib/auth/session';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { SubmitButton } from '@/components/ui/submit-button';
import { RuleForm } from './RuleForm';

export const metadata: Metadata = { title: 'Routing rules' };

export default async function RoutingPage() {
  await requireRolePage('ADMIN');
  const [rules, departments] = await Promise.all([
    prisma.routingRule.findMany({
      select: { id: true, keywords: true, departmentId: true, position: true, active: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1>Routing rules</h1>
        <p className="mt-1 max-w-3xl text-slate-700">
          If a complaint contains any of a rule&apos;s keywords as a whole word, it goes to that rule&apos;s department. Rules are
          checked in order (lowest number first) before the category default. Changes apply to new complaints only.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {rules.length === 0 ? (
            <EmptyState title="No routing rules">Complaints are routed by their category&apos;s default department.</EmptyState>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id} className={rule.active ? '' : 'bg-slate-100'}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{rule.active ? 'Active' : 'Disabled (ignored when routing)'}</p>
                  <form action={setRoutingRuleActiveAction}>
                    <input type="hidden" name="ruleId" value={rule.id} />
                    <input type="hidden" name="active" value={rule.active ? 'false' : 'true'} />
                    <SubmitButton variant="secondary">{rule.active ? 'Disable' : 'Enable'}</SubmitButton>
                  </form>
                </div>
                <RuleForm departments={departments} rule={rule} />
              </Card>
            ))
          )}
        </div>
        <Card>
          <CardTitle>Add rule</CardTitle>
          <RuleForm departments={departments} />
        </Card>
      </div>
    </div>
  );
}
