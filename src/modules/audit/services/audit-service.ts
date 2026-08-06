import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

export async function recordAudit(input: {
  actorUserId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
    },
  });
}

export async function recordSecurityEvent(input: {
  userId?: string | null;
  eventType: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.securityEvent.create({
    data: {
      userId: input.userId ?? null,
      eventType: input.eventType,
      metadata: input.metadata,
    },
  });
}
