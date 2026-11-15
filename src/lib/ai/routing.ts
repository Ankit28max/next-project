// Routing: which department gets the complaint, and which officer in it.
import type { Prisma } from '@prisma/client';
import { OPEN_STATUSES } from './config';
import { containsPhrase, normalize } from './text';

export interface RoutingRuleInput {
  keywords: string; // comma-separated
  departmentId: string;
  departmentName: string;
}

export interface DepartmentChoice {
  departmentId: string | null;
  reason: string;
}

/**
 * Order of precedence:
 * 1. admin routing rules (first rule with a whole-word keyword match wins)
 * 2. the default department of the complaint's category
 * 3. the default department of the category suggested by the analysis
 */
export function chooseDepartment(input: {
  text: string;
  rules: RoutingRuleInput[];
  categoryDepartment: { id: string; name: string } | null;
  suggestedDepartment: { id: string; name: string } | null;
}): DepartmentChoice {
  const text = normalize(input.text);
  for (const rule of input.rules) {
    const hit = rule.keywords.split(',').find((keyword) => containsPhrase(text, keyword));
    if (hit) {
      return { departmentId: rule.departmentId, reason: `Admin routing rule matched "${hit.trim()}": sent to ${rule.departmentName}.` };
    }
  }
  if (input.categoryDepartment) {
    return { departmentId: input.categoryDepartment.id, reason: `Default department for the category: ${input.categoryDepartment.name}.` };
  }
  if (input.suggestedDepartment) {
    return { departmentId: input.suggestedDepartment.id, reason: `Department suggested by the analysis: ${input.suggestedDepartment.name}.` };
  }
  return { departmentId: null, reason: 'No department could be determined.' };
}

export interface OfficerLoad {
  id: string;
  employeeId: string;
  openCases: number;
}

/** Fewest open cases wins; ties go to the lower employee id so the result is predictable. */
export function chooseOfficer(officers: OfficerLoad[]): OfficerLoad | null {
  if (officers.length === 0) return null;
  return [...officers].sort((a, b) => a.openCases - b.openCases || a.employeeId.localeCompare(b.employeeId))[0];
}

export async function loadOfficerWorkloads(db: Prisma.TransactionClient, departmentId: string): Promise<OfficerLoad[]> {
  const officers = await db.officerProfile.findMany({
    where: { departmentId, active: true, user: { active: true } },
    select: {
      id: true,
      employeeId: true,
      _count: { select: { complaintsAssigned: { where: { status: { in: [...OPEN_STATUSES] } } } } },
    },
  });
  return officers.map((o) => ({ id: o.id, employeeId: o.employeeId, openCases: o._count.complaintsAssigned }));
}
