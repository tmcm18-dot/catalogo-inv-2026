import { AuditResult, type Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export async function recordAudit(input: {
  actorUserId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  result?: AuditResult;
  requestId?: string | null;
  reason?: string | null;
  ipHash?: string | null;
  userAgentHash?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      result: input.result ?? AuditResult.SUCCESS,
      requestId: input.requestId ?? null,
      reason: input.reason ?? null,
      ipHash: input.ipHash ?? null,
      userAgentHash: input.userAgentHash ?? null,
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
