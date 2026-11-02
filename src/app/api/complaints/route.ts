import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { generateReferenceNumber } from '@/lib/utils';
import { runFullAIProcessingPipeline } from '@/lib/ai/pipeline';
import { createNotification } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';

const createComplaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(150),
  description: z.string().min(15, 'Description must be at least 15 characters').max(3000),
  categoryId: z.string().optional(),
  preferredDepartmentId: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  urgencyDeclared: z.boolean().optional(),
  consentGiven: z.boolean().refine((val) => val === true, 'Consent is required'),
  images: z
    .array(
      z.object({
        storageUrl: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        imageHash: z.string().optional(),
      })
    )
    .optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const departmentId = searchParams.get('departmentId');
    const categoryId = searchParams.get('categoryId');
    const riskLevel = searchParams.get('riskLevel');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Role-based visibility scoping
    const where: any = {};

    if (user.role === 'CITIZEN') {
      where.citizenId = user.id;
    } else if (user.role === 'OFFICER') {
      if (user.officerProfile?.departmentId) {
        where.departmentId = user.officerProfile.departmentId;
      }
    }
    // ADMIN has unscoped access

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (departmentId && user.role === 'ADMIN') where.departmentId = departmentId;
    if (categoryId) where.categoryId = categoryId;
    if (riskLevel) where.fraudRiskLevel = riskLevel;

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, complaints] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
          assignedOfficer: {
            select: {
              id: true,
              employeeId: true,
              user: { select: { name: true } },
            },
          },
          images: { select: { id: true, storageUrl: true, fileName: true } },
          citizen: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Mask internal fraud scores for citizen role
    const sanitized = complaints.map((c) => {
      if (user.role === 'CITIZEN') {
        return {
          ...c,
          fraudRiskScore: undefined,
          fraudRiskLevel: undefined,
        };
      }
      return c;
    });

    return NextResponse.json({
      success: true,
      data: sanitized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch complaints error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve complaints' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const result = createComplaintSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = result.data;
    const referenceNumber = generateReferenceNumber();

    // 1. Persist initial Complaint
    const newComplaint = await prisma.complaint.create({
      data: {
        referenceNumber,
        citizenId: user.id,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId || null,
        departmentId: data.preferredDepartmentId || null,
        address: data.address,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        urgencyDeclared: data.urgencyDeclared || false,
        consentGiven: data.consentGiven,
        status: 'SUBMITTED',
        images: data.images && data.images.length > 0
          ? {
              create: data.images.map((img) => ({
                storageUrl: img.storageUrl,
                fileName: img.fileName,
                mimeType: img.mimeType,
                fileSize: img.fileSize,
                imageHash: img.imageHash || null,
              })),
            }
          : undefined,
        statusHistory: {
          create: {
            actorId: user.id,
            previousStatus: 'SUBMITTED',
            newStatus: 'SUBMITTED',
            remarks: 'Grievance registered by citizen. Awaiting automated classification.',
          },
        },
      },
      include: {
        images: true,
      },
    });

    // 2. Trigger AI Analysis Pipeline (Multimodal classification, duplicate detection, fraud scoring, auto-routing)
    const firstImageHash = newComplaint.images?.[0]?.imageHash || null;
    const imageUrls = newComplaint.images?.map((i) => i.storageUrl) || [];

    const aiReport = await runFullAIProcessingPipeline({
      complaintId: newComplaint.id,
      citizenId: user.id,
      title: newComplaint.title,
      description: newComplaint.description,
      categoryId: newComplaint.categoryId,
      latitude: newComplaint.latitude,
      longitude: newComplaint.longitude,
      imageHash: firstImageHash,
      imageUrls,
    });

    // 3. Create Notification for citizen
    await createNotification({
      userId: user.id,
      complaintId: newComplaint.id,
      title: `Grievance Registered: ${referenceNumber}`,
      message: `Your grievance has been successfully submitted and routed to ${aiReport.classification.recommendedDepartmentCode || 'Department'}. Track progress using your reference ID.`,
      type: 'STATUS_CHANGE',
    });

    // 4. Log Audit Event
    const ip = req.headers.get('x-forwarded-for') || req.ip;
    await logAuditEvent({
      actorId: user.id,
      action: 'COMPLAINT_SUBMITTED',
      entityType: 'Complaint',
      entityId: newComplaint.id,
      metadata: {
        referenceNumber,
        category: aiReport.classification.predictedCategory,
        duplicateScore: aiReport.duplicateScore,
        fraudScore: aiReport.fraudAssessment.riskScore,
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Grievance submitted successfully',
      data: {
        id: newComplaint.id,
        referenceNumber,
        status: newComplaint.status,
        aiSummary: {
          category: aiReport.classification.predictedCategory,
          department: aiReport.classification.recommendedDepartmentCode,
          priority: aiReport.classification.suggestedPriority,
          confidence: aiReport.classification.confidence,
          duplicatesFound: aiReport.topDuplicates.length,
          duplicateScore: aiReport.duplicateScore,
          fraudRiskLevel: aiReport.fraudAssessment.riskLevel,
        },
      },
    });
  } catch (error: any) {
    console.error('Create complaint error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit grievance. Please try again.' },
      { status: 500 }
    );
  }
}
