import { prisma } from '@/lib/db/prisma';

export interface AuditLogOptions {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
}

export async function logAuditEvent({
  actorId,
  action,
  entityType,
  entityId,
  metadata,
  ipAddress,
}: AuditLogOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        action,
        entityType,
        entityId: entityId || null,
        metadata: metadata ? (metadata as any) : undefined,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    // Non-blocking error handling for audit logging
    console.error('Failed to write audit log:', error);
  }
}
