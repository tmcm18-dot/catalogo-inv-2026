import { prisma } from '@/lib/db/prisma';

export async function invalidateGrantsForSession(sessionId: string): Promise<void> {
  await prisma.sensitiveActionGrant.updateMany({
    where: { sessionId, consumedAt: null },
    data: { consumedAt: new Date() },
  });
}

export async function invalidateGrantsForUser(userId: string): Promise<void> {
  await prisma.sensitiveActionGrant.updateMany({
    where: { userId, consumedAt: null },
    data: { consumedAt: new Date() },
  });
}
