import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role-based where condition
    const where: any = {};
    if (user.role === 'OFFICER' && user.officerProfile?.departmentId) {
      where.departmentId = user.officerProfile.departmentId;
    }

    const [
      totalCount,
      submittedCount,
      underReviewCount,
      assignedCount,
      inProgressCount,
      resolvedCount,
      rejectedCount,
      highFraudRiskCount,
      duplicateCount,
      complaintsByDept,
      complaintsByCategory,
      resolvedComplaints,
    ] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.count({ where: { ...where, status: 'SUBMITTED' } }),
      prisma.complaint.count({ where: { ...where, status: 'UNDER_REVIEW' } }),
      prisma.complaint.count({ where: { ...where, status: 'ASSIGNED' } }),
      prisma.complaint.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.complaint.count({ where: { ...where, status: 'RESOLVED' } }),
      prisma.complaint.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.complaint.count({ where: { ...where, fraudRiskLevel: 'HIGH' } }),
      prisma.complaintMatch.count({
        where: where.departmentId
          ? { complaint: { departmentId: where.departmentId } }
          : undefined,
      }),
      prisma.complaint.groupBy({
        by: ['departmentId'],
        _count: { id: true },
        where,
      }),
      prisma.complaint.groupBy({
        by: ['categoryId'],
        _count: { id: true },
        where,
      }),
      prisma.complaint.findMany({
        where: { ...where, status: 'RESOLVED', resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
        take: 100,
      }),
    ]);

    // Calculate Average Resolution Time in Hours
    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((acc, curr) => {
        if (!curr.resolvedAt) return acc;
        const diffMs = new Date(curr.resolvedAt).getTime() - new Date(curr.createdAt).getTime();
        return acc + diffMs / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedComplaints.length) * 10) / 10;
    }

    // Hydrate Department Names
    const departments = await prisma.department.findMany({
      select: { id: true, name: true, code: true },
    });
    const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

    const departmentStats = complaintsByDept.map((item) => ({
      departmentId: item.departmentId || 'unassigned',
      name: item.departmentId ? deptMap[item.departmentId] || 'Unknown' : 'Unassigned Triage',
      count: item._count.id,
    }));

    // Hydrate Category Names
    const categories = await prisma.complaintCategory.findMany({
      select: { id: true, name: true },
    });
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

    const categoryStats = complaintsByCategory.map((item) => ({
      categoryId: item.categoryId || 'unclassified',
      name: item.categoryId ? catMap[item.categoryId] || 'Other' : 'General Civic',
      count: item._count.id,
    }));

    return NextResponse.json({
      success: true,
      data: {
        total: totalCount,
        submitted: submittedCount,
        underReview: underReviewCount,
        assigned: assignedCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        rejected: rejectedCount,
        highFraudRisk: highFraudRiskCount,
        duplicatesFlagged: duplicateCount,
        avgResolutionHours,
        byDepartment: departmentStats,
        byCategory: categoryStats,
      },
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compute dashboard statistics' },
      { status: 500 }
    );
  }
}
