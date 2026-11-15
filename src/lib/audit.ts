import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

interface AuditEntry {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/** Pass `db` to write inside a transaction. A failed audit write never breaks the request. */
export async function logAudit(entry: AuditEntry, db: Prisma.TransactionClient = prisma): Promise<void> {
  try {
    await db.auditLog.create({ data: entry });
  } catch (error) {
    console.error('Audit log write failed:', error);
  }
}
