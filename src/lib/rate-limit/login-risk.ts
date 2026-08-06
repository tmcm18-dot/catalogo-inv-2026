import { prisma } from '@/lib/db/prisma';
import { UserStatus } from '@prisma/client';
import {
  captchaRequiredForRisk,
  computeRiskScore,
} from '@/lib/rate-limit/limiter';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
  riskScore: number;
  captchaRequired: boolean;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
/** Failed attempts before soft-blocking the account temporarily. */
const SOFT_BLOCK_ATTEMPTS = 8;
const SOFT_BLOCK_MS = 15 * 60 * 1000;

export async function checkLoginRisk(input: {
  ipHash: string;
  identifierHash: string;
  userId?: string;
}): Promise<RateLimitResult> {
  const since = new Date(Date.now() - WINDOW_MS);

  if (input.userId) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { status: true, blockedUntil: true, updatedAt: true },
    });
    if (user?.status === UserStatus.TEMPORARILY_BLOCKED) {
      const unblockAt = user.blockedUntil
        ? user.blockedUntil.getTime()
        : user.updatedAt.getTime() + SOFT_BLOCK_MS;
      if (Date.now() < unblockAt) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.ceil((unblockAt - Date.now()) / 1000),
          riskScore: 100,
          captchaRequired: true,
        };
      }
      await prisma.user.update({
        where: { id: input.userId },
        data: { status: UserStatus.ACTIVE, blockedUntil: null },
      });
    }
  }

  const attempts = await prisma.loginAttempt.count({
    where: {
      success: false,
      createdAt: { gte: since },
      OR: [{ ipHash: input.ipHash }, { identifierHash: input.identifierHash }],
    },
  });

  const riskScore = computeRiskScore(attempts);
  const allowed = attempts < MAX_ATTEMPTS && riskScore < 90;

  return {
    allowed,
    remaining: Math.max(0, MAX_ATTEMPTS - attempts),
    retryAfterSeconds: allowed ? undefined : 900,
    riskScore,
    captchaRequired: captchaRequiredForRisk(riskScore),
  };
}

export async function recordLoginAttempt(input: {
  identifierHash: string;
  ipHash: string;
  deviceHash?: string;
  userId?: string;
  success: boolean;
}): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      identifierHash: input.identifierHash,
      ipHash: input.ipHash,
      deviceHash: input.deviceHash,
      userId: input.userId,
      success: input.success,
    },
  });

  if (!input.success && input.userId) {
    const since = new Date(Date.now() - WINDOW_MS);
    const failures = await prisma.loginAttempt.count({
      where: {
        userId: input.userId,
        success: false,
        createdAt: { gte: since },
      },
    });

    if (failures >= SOFT_BLOCK_ATTEMPTS) {
      await prisma.user.updateMany({
        where: {
          id: input.userId,
          status: UserStatus.ACTIVE,
        },
        data: {
          status: UserStatus.TEMPORARILY_BLOCKED,
          blockedUntil: new Date(Date.now() + SOFT_BLOCK_MS),
        },
      });
    }
  }

  if (input.success && input.userId) {
    await prisma.user.updateMany({
      where: {
        id: input.userId,
        status: UserStatus.TEMPORARILY_BLOCKED,
      },
      data: { status: UserStatus.ACTIVE, blockedUntil: null },
    });
  }
}
