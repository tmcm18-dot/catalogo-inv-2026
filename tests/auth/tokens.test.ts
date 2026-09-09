import { describe, expect, it } from 'vitest';
import {
  createSecureToken,
  hashToken,
  timingSafeEqualHex,
} from '@/lib/security/tokens';

describe('tokens', () => {
  it('creates unique base64url tokens', () => {
    const a = createSecureToken(32);
    const b = createSecureToken(32);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('hashes deterministically with sha256 hex', () => {
    const hash = hashToken('secret-token');
    expect(hash).toHaveLength(64);
    expect(hashToken('secret-token')).toBe(hash);
    expect(hashToken('other')).not.toBe(hash);
  });

  it('compares hex digests in constant time', () => {
    const hash = hashToken('abc');
    expect(timingSafeEqualHex(hash, hash)).toBe(true);
    expect(timingSafeEqualHex(hash, hashToken('xyz'))).toBe(false);
    expect(timingSafeEqualHex(hash, 'zz')).toBe(false);
  });
});
