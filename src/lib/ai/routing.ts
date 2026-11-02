import { prisma } from '@/lib/db/prisma';

export interface RoutingResult {
  departmentId: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  assignedOfficerId: string | null;
  assignedOfficerName: string | null;
  routingRationale: string;
}

export async function routeGrievance(
  categoryId?: string | null,
  recommendedDepartmentCode?: string | null,
  textDescription?: string
): Promise<RoutingResult> {
  let targetDepartment: { id: string; code: string; name: string } | null = null;
  let ruleRationale = 'Routed using default civic category mapping';

  // 1. Check custom routing rules matching keywords in description if available
  if (textDescription) {
    const activeRules = await prisma.routingRule.findMany({
      where: { active: true },
      include: { department: true },
    });

    const lowerText = textDescription.toLowerCase();
    for (const rule of activeRules) {
      const keywords = rule.keywords.split(',').map((k) => k.trim().toLowerCase());
      const hasMatch = keywords.some((kw) => kw.length > 2 && lowerText.includes(kw));
      if (hasMatch) {
        targetDepartment = rule.department;
        ruleRationale = `Matched automated routing rule: "${rule.keywords}" -> ${rule.department.name}`;
        break;
      }
    }
  }

  // 2. If no rule hit, match by category's default department
  if (!targetDepartment && categoryId) {
    const category = await prisma.complaintCategory.findUnique({
      where: { id: categoryId },
      include: { defaultDepartment: true },
    });

    if (category?.defaultDepartment) {
      targetDepartment = category.defaultDepartment;
      ruleRationale = `Routed via category "${category.name}" to ${category.defaultDepartment.name}`;
    }
  }

  // 3. Fallback to AI-recommended department code (e.g. "PWD", "WATER", "ELEC", "HEALTH")
  if (!targetDepartment && recommendedDepartmentCode) {
    const dept = await prisma.department.findUnique({
      where: { code: recommendedDepartmentCode },
    });
    if (dept) {
      targetDepartment = dept;
      ruleRationale = `Routed via AI classification code "${recommendedDepartmentCode}" to ${dept.name}`;
    }
  }

  // 4. Default fallback to first active department
  if (!targetDepartment) {
    const firstDept = await prisma.department.findFirst({
      orderBy: { code: 'asc' },
    });
    if (firstDept) {
      targetDepartment = firstDept;
      ruleRationale = 'Default civic triage assigned to general administration queue';
    }
  }

  if (!targetDepartment) {
    return {
      departmentId: null,
      departmentCode: null,
      departmentName: null,
      assignedOfficerId: null,
      assignedOfficerName: null,
      routingRationale: 'No department available in system',
    };
  }

  // 5. Workload balancing: Find active officers in this department and pick the one with least open tickets
  const officers = await prisma.officerProfile.findMany({
    where: {
      departmentId: targetDepartment.id,
      active: true,
    },
    include: {
      user: { select: { name: true } },
      complaintsAssigned: {
        where: {
          status: { in: ['ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW'] },
        },
        select: { id: true },
      },
    },
  });

  let assignedOfficerId: string | null = null;
  let assignedOfficerName: string | null = null;

  if (officers.length > 0) {
    // Sort ascending by open ticket workload
    officers.sort((a, b) => a.complaintsAssigned.length - b.complaintsAssigned.length);
    const chosen = officers[0];
    assignedOfficerId = chosen.id;
    assignedOfficerName = chosen.user.name;
    ruleRationale += ` | Assigned to Officer ${chosen.user.name} (Workload: ${chosen.complaintsAssigned.length} active cases)`;
  } else {
    ruleRationale += ' | No individual officer assigned; queued for Department Head review';
  }

  return {
    departmentId: targetDepartment.id,
    departmentCode: targetDepartment.code,
    departmentName: targetDepartment.name,
    assignedOfficerId,
    assignedOfficerName,
    routingRationale: ruleRationale,
  };
}
