// The submit pipeline: classify -> find duplicates -> assess risk -> route -> save.
// The vision-model call happens first (it is a slow network call), then everything
// that touches the database runs inside ONE transaction, so a complaint is never
// saved half-analysed.
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { HttpError, type SessionUser } from '@/lib/auth/guards';
import { getImage } from '@/lib/storage';
import { classifyByRules } from '@/lib/ai/classification';
import { classifyWithGemini, describeGeminiFailure, geminiModelName, isGeminiConfigured, type GeminiResult } from '@/lib/ai/gemini';
import { findDuplicates } from '@/lib/ai/duplicates';
import { assessFraud, gatherHistorySignals } from '@/lib/ai/fraud';
import { chooseDepartment, chooseOfficer, loadOfficerWorkloads } from '@/lib/ai/routing';
import type { Severity } from '@/lib/ai/categories';
import { generateReferenceNumber } from './reference';

export const submitSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters.').max(150),
  description: z.string().trim().min(15, 'Description must be at least 15 characters.').max(3000),
  categoryId: z.string().max(40).optional(),
  address: z.string().trim().min(5, 'Please enter the address or a landmark.').max(500),
  latitude: z.number({ required_error: 'Please mark the location on the map.' }).min(-90).max(90),
  longitude: z.number({ required_error: 'Please mark the location on the map.' }).min(-180).max(180),
  urgencyDeclared: z.boolean().default(false),
  consentGiven: z.literal(true, { errorMap: () => ({ message: 'Consent is required to submit.' }) }),
  imageId: z.string({ required_error: 'A photo is required.' }).min(1).max(40),
});

export interface SubmitResult {
  id: string;
  referenceNumber: string;
  categoryName: string | null;
  departmentName: string | null;
  analysedBy: 'gemini' | 'rules' | 'none';
  similarComplaints: number;
  needsManualTriage: boolean;
}

interface Classification {
  provider: 'gemini' | 'rules';
  modelName: string;
  categoryCode: string;
  ruleMatchStrength: number;
  severity: Severity;
  reasons: string[];
  fallbackReason: string | null;
  vision: GeminiResult | null;
}

/** Rules always run. The vision model is tried on top; on ANY failure the rules answer is used. */
async function classify(title: string, description: string, imageUrl: string): Promise<Classification> {
  const rules = classifyByRules(title, description);
  const fromRules = (fallbackReason: string): Classification => ({
    provider: 'rules',
    modelName: 'keyword-rules',
    categoryCode: rules.categoryCode,
    ruleMatchStrength: rules.matchStrength,
    severity: rules.severity,
    reasons: rules.reasons,
    fallbackReason,
    vision: null,
  });

  if (!isGeminiConfigured()) return fromRules('Vision model not configured (no API key).');
  try {
    const vision = await classifyWithGemini({ title, description, jpeg: await getImage(imageUrl) });
    return {
      provider: 'gemini',
      modelName: geminiModelName(),
      categoryCode: vision.category,
      ruleMatchStrength: rules.matchStrength,
      severity: vision.severity,
      reasons: vision.reasons,
      fallbackReason: null,
      vision,
    };
  } catch (error) {
    const why = describeGeminiFailure(error);
    console.warn('Vision model failed, using rules:', why);
    return fromRules(`Vision model unavailable: ${why}.`);
  }
}

function isReferenceCollision(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    String(error.meta?.target ?? '').includes('referenceNumber')
  );
}

const TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

export async function submitComplaint(user: SessionUser, rawInput: unknown): Promise<SubmitResult> {
  const input = submitSchema.parse(rawInput);

  // The photo must have been uploaded by this user and not be attached to anything yet.
  const image = await prisma.complaintImage.findFirst({
    where: { id: input.imageId, uploaderId: user.id, complaintId: null },
  });
  if (!image) throw new HttpError(400, 'Photo not found. Please upload it again.');

  const chosenCategory = input.categoryId
    ? await prisma.complaintCategory.findFirst({ where: { id: input.categoryId, active: true }, select: { id: true } })
    : null;
  if (input.categoryId && !chosenCategory) throw new HttpError(400, 'Unknown category.');

  const cls = await classify(input.title, input.description, image.storageUrl);
  const text = `${input.title} ${input.description}`;

  const baseData = {
    citizenId: user.id,
    title: input.title,
    description: input.description,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    urgencyDeclared: input.urgencyDeclared,
    consentGiven: true,
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const categories = await tx.complaintCategory.findMany({
          select: { id: true, code: true, name: true, defaultDepartment: { select: { id: true, name: true } } },
        });
        const suggested = categories.find((c) => c.code === cls.categoryCode) ?? null;
        const category = categories.find((c) => c.id === chosenCategory?.id) ?? suggested;

        // 2. Duplicates
        const matches = await findDuplicates(tx, {
          text,
          latitude: input.latitude,
          longitude: input.longitude,
          categoryCode: category?.code ?? null,
          imageHash: image.imageHash,
        });

        // 3. Fraud risk
        const history = await gatherHistorySignals(tx, { citizenId: user.id, imageHash: image.imageHash });
        const fraud = assessFraud({
          text,
          submittedAt: new Date(),
          latitude: input.latitude,
          longitude: input.longitude,
          image,
          ...history,
          duplicateOfOwnComplaint: matches.some((m) => m.matchedCitizenId === user.id),
          imageMatchesText: cls.vision?.imageMatchesText ?? null,
          looksLikeStockOrScreenshot: cls.vision?.looksLikeStockOrScreenshot ?? null,
        });

        // 4. Routing
        const rules = await tx.routingRule.findMany({
          where: { active: true },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
          select: { keywords: true, departmentId: true, department: { select: { name: true } } },
        });
        const route = chooseDepartment({
          text,
          rules: rules.map((r) => ({ keywords: r.keywords, departmentId: r.departmentId, departmentName: r.department.name })),
          categoryDepartment: category?.defaultDepartment ?? null,
          suggestedDepartment: suggested?.defaultDepartment ?? null,
        });
        const officer = route.departmentId ? chooseOfficer(await loadOfficerWorkloads(tx, route.departmentId)) : null;
        const department = route.departmentId
          ? await tx.department.findUnique({ where: { id: route.departmentId }, select: { name: true } })
          : null;

        const priority: Severity =
          input.urgencyDeclared && (cls.severity === 'LOW' || cls.severity === 'MEDIUM') ? 'HIGH' : cls.severity;

        const complaint = await tx.complaint.create({
          data: {
            ...baseData,
            referenceNumber: generateReferenceNumber(),
            categoryId: category?.id ?? null,
            departmentId: route.departmentId,
            assignedOfficerId: officer?.id ?? null,
            status: officer ? 'ASSIGNED' : 'SUBMITTED',
            priority,
            duplicateScore: matches[0]?.combinedScore ?? 0,
            fraudRiskScore: fraud.score,
            fraudRiskLevel: fraud.level,
            needsManualTriage: route.departmentId === null,
            triageReason: route.departmentId === null ? route.reason : null,
          },
        });

        await tx.complaintImage.update({ where: { id: image.id }, data: { complaintId: complaint.id } });

        // Duplicates are linked for the officer to compare. Nothing is ever deleted or merged automatically.
        if (matches.length > 0) {
          await tx.complaintMatch.createMany({
            data: matches.map((m) => ({
              complaintId: complaint.id,
              matchedComplaintId: m.matchedComplaintId,
              textSimilarity: m.textSimilarity,
              imageSimilarity: m.hamming === null ? null : 1 - m.hamming / 64,
              distanceMeters: m.distanceMeters,
              combinedScore: m.combinedScore,
              reasons: m.reasons,
            })),
          });
        }

        await tx.complaintAnalysis.create({
          data: {
            complaintId: complaint.id,
            provider: cls.provider,
            modelName: cls.modelName,
            categoryCode: cls.categoryCode,
            ruleMatchStrength: cls.ruleMatchStrength,
            severity: cls.severity,
            imageMatchesText: cls.vision?.imageMatchesText ?? null,
            looksLikeStockOrScreenshot: cls.vision?.looksLikeStockOrScreenshot ?? null,
            classificationReasons: cls.reasons,
            fallbackReason: cls.fallbackReason,
            fraudRiskScore: fraud.score,
            fraudRiskLevel: fraud.level,
            fraudReasons: fraud.reasons,
            routingReason: route.reason,
          },
        });

        await tx.complaintStatusHistory.create({
          data: {
            complaintId: complaint.id,
            actorId: user.id,
            previousStatus: 'SUBMITTED',
            newStatus: 'SUBMITTED',
            remarks: 'Complaint submitted.',
          },
        });
        if (officer) {
          await tx.complaintStatusHistory.create({
            data: {
              complaintId: complaint.id,
              previousStatus: 'SUBMITTED',
              newStatus: 'ASSIGNED',
              remarks: `Automatically routed to ${department?.name ?? 'a department'} and assigned to an officer.`,
            },
          });
          const officerUser = await tx.officerProfile.findUnique({ where: { id: officer.id }, select: { userId: true } });
          if (officerUser) {
            await tx.notification.create({
              data: {
                userId: officerUser.userId,
                complaintId: complaint.id,
                title: `New complaint assigned: ${complaint.referenceNumber}`,
                message: complaint.title,
              },
            });
          }
        }

        await tx.notification.create({
          data: {
            userId: user.id,
            complaintId: complaint.id,
            title: `Complaint registered: ${complaint.referenceNumber}`,
            message: department
              ? `Your complaint was sent to ${department.name}.`
              : 'Your complaint was received and is waiting to be assigned to a department.',
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: 'COMPLAINT_SUBMITTED',
            entityType: 'Complaint',
            entityId: complaint.id,
            metadata: { referenceNumber: complaint.referenceNumber, analysedBy: cls.provider },
          },
        });

        return {
          id: complaint.id,
          referenceNumber: complaint.referenceNumber,
          categoryName: category?.name ?? null,
          departmentName: department?.name ?? null,
          analysedBy: cls.provider,
          similarComplaints: matches.length,
          needsManualTriage: complaint.needsManualTriage,
        };
      }, TX_OPTIONS);
    } catch (error) {
      if (isReferenceCollision(error) && attempt < 3) continue;
      console.error('Complaint analysis failed; saving for manual triage:', error);
      break;
    }
  }

  // 5. The analysis failed. The complaint is still saved, clearly marked as NOT analysed:
  //    no risk level at all (never "LOW"), no department, visible to admins for manual triage.
  return saveForManualTriage(user, baseData, image.id);
}

async function saveForManualTriage(
  user: SessionUser,
  baseData: Omit<Prisma.ComplaintUncheckedCreateInput, 'referenceNumber'>,
  imageId: string
): Promise<SubmitResult> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const complaint = await tx.complaint.create({
          data: {
            ...baseData,
            referenceNumber: generateReferenceNumber(),
            needsManualTriage: true,
            triageReason: 'Automatic analysis failed. Category, duplicates and risk were not assessed.',
          },
        });
        await tx.complaintImage.update({ where: { id: imageId }, data: { complaintId: complaint.id } });
        await tx.complaintStatusHistory.create({
          data: { complaintId: complaint.id, actorId: user.id, previousStatus: 'SUBMITTED', newStatus: 'SUBMITTED', remarks: 'Complaint submitted.' },
        });
        await tx.notification.create({
          data: {
            userId: user.id,
            complaintId: complaint.id,
            title: `Complaint registered: ${complaint.referenceNumber}`,
            message: 'Your complaint was received and is waiting to be assigned to a department.',
          },
        });
        await tx.auditLog.create({
          data: { actorId: user.id, action: 'COMPLAINT_SUBMITTED_NEEDS_TRIAGE', entityType: 'Complaint', entityId: complaint.id },
        });
        return {
          id: complaint.id,
          referenceNumber: complaint.referenceNumber,
          categoryName: null,
          departmentName: null,
          analysedBy: 'none' as const,
          similarComplaints: 0,
          needsManualTriage: true,
        };
      }, TX_OPTIONS);
    } catch (error) {
      if (isReferenceCollision(error) && attempt < 3) continue;
      throw error;
    }
  }
}
