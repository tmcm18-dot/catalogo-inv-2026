export type RateLimitConsumeInput = {
  key: string;
  limit: number;
  windowMs: number;
  /** Progressive soft-block duration when limit exceeded. */
  blockMs?: number;
};

export type RateLimitConsumeResult = {
  allowed: boolean;
  remaining: number;
  count: number;
  retryAfterSeconds?: number;
  blockedUntil?: Date | null;
};

export interface RateLimitStore {
  consume(input: RateLimitConsumeInput): Promise<RateLimitConsumeResult>;
  reset(key: string): Promise<void>;
}

declare global {
  // Persistent across HMR in Next.js / Vitest workers.
  var __invRateLimitMemory: Map<string, MemoryEntry> | undefined;
}

type MemoryEntry = {
  windowStartedAt: number;
  count: number;
  blockedUntil: number | null;
};

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly map: Map<string, MemoryEntry>;

  constructor(shared = true) {
    if (shared) {
      if (!globalThis.__invRateLimitMemory) {
        globalThis.__invRateLimitMemory = new Map();
      }
      this.map = globalThis.__invRateLimitMemory;
    } else {
      this.map = new Map();
    }
  }

  async consume(input: RateLimitConsumeInput): Promise<RateLimitConsumeResult> {
    const now = Date.now();
    let entry = this.map.get(input.key);

    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        count: entry.count,
        retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000),
        blockedUntil: new Date(entry.blockedUntil),
      };
    }

    if (!entry || now - entry.windowStartedAt >= input.windowMs) {
      entry = { windowStartedAt: now, count: 0, blockedUntil: null };
    }

    entry.count += 1;
    const allowed = entry.count <= input.limit;

    if (!allowed && input.blockMs) {
      entry.blockedUntil = now + input.blockMs;
    }

    this.map.set(input.key, entry);

    return {
      allowed,
      remaining: Math.max(0, input.limit - entry.count),
      count: entry.count,
      retryAfterSeconds: allowed
        ? undefined
        : Math.ceil(
            ((entry.blockedUntil ?? entry.windowStartedAt + input.windowMs) - now) /
              1000,
          ),
      blockedUntil: entry.blockedUntil ? new Date(entry.blockedUntil) : null,
    };
  }

  async reset(key: string): Promise<void> {
    this.map.delete(key);
  }
}

/**
 * Prepared Redis adapter. Not required for local/dev.
 * Activates only when REDIS_URL is set and a fetch-compatible client is wired.
 * Throws if used without configuration — callers must fall back to MemoryStore.
 */
export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly redisUrl: string) {
    if (!redisUrl) {
      throw new Error('REDIS_URL is required for RedisRateLimitStore');
    }
  }

  async consume(input: RateLimitConsumeInput): Promise<RateLimitConsumeResult> {
    // Placeholder for distributed deployments. Prefer MemoryRateLimitStore until
    // a shared Redis client is configured in production.
    void this.redisUrl;
    void input;
    throw new Error(
      'RedisRateLimitStore is prepared but not wired. Configure a shared store before multi-instance deploy.',
    );
  }

  async reset(key: string): Promise<void> {
    void key;
    throw new Error(
      'RedisRateLimitStore is prepared but not wired. Configure a shared store before multi-instance deploy.',
    );
  }
}

let cachedStore: RateLimitStore | null = null;

export function getRateLimitStore(): RateLimitStore {
  if (cachedStore) return cachedStore;

  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl && process.env.RATE_LIMIT_STORE === 'redis') {
    cachedStore = new RedisRateLimitStore(redisUrl);
  } else {
    cachedStore = new MemoryRateLimitStore(true);
  }
  return cachedStore;
}

/** Test helper to inject a fresh store. */
export function setRateLimitStoreForTests(store: RateLimitStore | null): void {
  cachedStore = store;
}
