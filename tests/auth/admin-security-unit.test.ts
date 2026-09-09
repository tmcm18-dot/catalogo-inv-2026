import { describe, expect, it, beforeEach } from 'vitest';
import {
  MemoryRateLimitStore,
  setRateLimitStoreForTests,
} from '@/lib/rate-limit/store';
import {
  captchaRequiredForRisk,
  computeRiskScore,
  enforceRateLimit,
} from '@/lib/rate-limit/limiter';
import {
  MockCaptchaProvider,
  setCaptchaProviderForTests,
} from '@/lib/captcha/provider';
import { RateLimitedError } from '@/lib/errors';
import { parseReauthScope } from '@/modules/auth/services/reauth-service';
import { REAUTH_SCOPES } from '@/modules/authorization/permissions';
import { assertAdminReason } from '@/modules/admin/policies/admin-guards';
import { ValidationError } from '@/lib/errors';

describe('rate limit store', () => {
  beforeEach(() => {
    setRateLimitStoreForTests(new MemoryRateLimitStore(false));
  });

  it('allows under limit and blocks progressively', async () => {
    const store = new MemoryRateLimitStore(false);
    setRateLimitStoreForTests(store);

    for (let i = 0; i < 3; i += 1) {
      const result = await enforceRateLimit({
        dimensions: { endpoint: 'test.ep', ipHash: 'ip1' },
        limit: 3,
        windowMs: 60_000,
        blockMs: 30_000,
      });
      expect(result.allowed).toBe(true);
    }

    await expect(
      enforceRateLimit({
        dimensions: { endpoint: 'test.ep', ipHash: 'ip1' },
        limit: 3,
        windowMs: 60_000,
        blockMs: 30_000,
      }),
    ).rejects.toBeInstanceOf(RateLimitedError);
  });
});

describe('risk + captcha', () => {
  beforeEach(() => {
    setCaptchaProviderForTests(new MockCaptchaProvider());
  });

  it('computes risk score and captcha threshold', () => {
    expect(computeRiskScore(0)).toBe(0);
    expect(computeRiskScore(4)).toBe(40);
    expect(captchaRequiredForRisk(39)).toBe(false);
    expect(captchaRequiredForRisk(40)).toBe(true);
  });

  it('mock captcha accepts mock tokens only', async () => {
    const provider = new MockCaptchaProvider();
    expect((await provider.verify({ token: 'mock-ok' })).success).toBe(true);
    expect((await provider.verify({ token: 'bad' })).success).toBe(false);
    expect((await provider.verify({ token: '' })).success).toBe(false);
  });
});

describe('admin guards helpers', () => {
  it('requires administrative reason length', () => {
    expect(() => assertAdminReason('abc')).toThrow(ValidationError);
    expect(assertAdminReason('Motivo válido de prueba')).toContain('Motivo');
  });
});

describe('reauth scopes', () => {
  it('parses known scopes', () => {
    expect(parseReauthScope(REAUTH_SCOPES.ROLES_MANAGE)).toBe('roles.manage');
    expect(() => parseReauthScope('nope')).toThrow(ValidationError);
  });
});
