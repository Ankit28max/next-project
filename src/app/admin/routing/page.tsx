import React from 'react';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriorityBadge } from '@/components/ui/badge';
import { Building2, Plus, Sparkles, Workflow } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminRoutingPage() {
  const [categories, rules] = await Promise.all([
    prisma.complaintCategory.findMany({
      include: { defaultDepartment: true },
      orderBy: { name: 'asc' },
    }),
    prisma.routingRule.findMany({
      include: {
        department: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gov-900">Automated Routing Rules & Categories</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure how the AI classification engine maps linguistic markers and categories to responsible municipal departments.
        </p>
      </div>

      {/* Routing Rules Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Workflow className="h-4 w-4 text-gov-800" />
            <span>Keyword-to-Department Automated Rules ({rules.length})</span>
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Trigger Keywords</th>
                <th className="p-3.5">Target Department</th>
                <th className="p-3.5">Associated Category</th>
                <th className="p-3.5">Assigned Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <span className="font-mono text-gov-900 font-semibold bg-slate-100 px-2.5 py-1 rounded">
                      {rule.keywords}
                    </span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-gov-700" />
                      {rule.department.name} ({rule.department.code})
                    </span>
                  </td>
                  <td className="p-3.5 whitespace-nowrap text-slate-600">
                    {rule.category?.name || 'Any Category'}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <PriorityBadge priority={rule.priority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Civic Categories Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600" />
          <span>Active Civic Complaint Categories ({categories.length})</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="border-slate-200">
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-gov-900 bg-gov-50 px-2 py-0.5 rounded border border-gov-200 text-[10px]">
                    {cat.code}
                  </span>
                  <PriorityBadge priority={cat.defaultPriority} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{cat.name}</h3>
                <p className="text-slate-600 text-[11px] leading-relaxed">{cat.description}</p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Default Dept: </span>
                  <span className="font-semibold text-slate-800">
                    {cat.defaultDepartment?.name || 'General Administration'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
