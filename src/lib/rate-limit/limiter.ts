import { RateLimitedError } from '@/lib/errors';
import {
  getRateLimitStore,
  type RateLimitConsumeResult,
} from '@/lib/rate-limit/store';

export type RateLimitDimensions = {
  ipHash?: string;
  accountId?: string;
  identifierHash?: string;
  sessionId?: string;
  deviceHash?: string;
  endpoint: string;
};

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_LIMIT = 60;
const DEFAULT_BLOCK_MS = 15 * 60 * 1000;

function buildKeys(dims: RateLimitDimensions): string[] {
  const keys: string[] = [`ep:${dims.endpoint}`];
  if (dims.ipHash) keys.push(`ip:${dims.ipHash}:ep:${dims.endpoint}`);
  if (dims.accountId) keys.push(`acct:${dims.accountId}:ep:${dims.endpoint}`);
  if (dims.identifierHash) {
    keys.push(`id:${dims.identifierHash}:ep:${dims.endpoint}`);
  }
  if (dims.sessionId) keys.push(`sess:${dims.sessionId}:ep:${dims.endpoint}`);
  if (dims.deviceHash) keys.push(`dev:${dims.deviceHash}:ep:${dims.endpoint}`);
  return keys;
}

export async function enforceRateLimit(input: {
  dimensions: RateLimitDimensions;
  limit?: number;
  windowMs?: number;
  blockMs?: number;
}): Promise<RateLimitConsumeResult> {
  const store = getRateLimitStore();
  const limit = input.limit ?? DEFAULT_LIMIT;
  const windowMs = input.windowMs ?? DEFAULT_WINDOW_MS;
  const blockMs = input.blockMs ?? DEFAULT_BLOCK_MS;

  let worst: RateLimitConsumeResult = {
    allowed: true,
    remaining: limit,
    count: 0,
  };

  for (const key of buildKeys(input.dimensions)) {
    const result = await store.consume({ key, limit, windowMs, blockMs });
    if (!result.allowed) {
      throw new RateLimitedError(result.retryAfterSeconds);
    }
    if (result.remaining < worst.remaining) {
      worst = result;
    }
  }

  return worst;
}

export function computeRiskScore(failedAttempts: number): number {
  return Math.min(100, failedAttempts * 10);
}

export function captchaRequiredForRisk(riskScore: number): boolean {
  return riskScore >= 40;
}
