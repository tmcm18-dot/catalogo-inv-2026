import { describe, expect, it } from 'vitest';
import {
  createTotpSecret,
  createRecoveryCodes,
  generateTotpCode,
  verifyTotpCode,
  encryptTotpSecret,
  decryptTotpSecret,
} from '@/lib/security/totp';

describe('totp', () => {
  it('encrypts and decrypts secrets', () => {
    const secret = createTotpSecret();
    const encrypted = encryptTotpSecret(secret);
    expect(encrypted).not.toBe(secret);
    expect(decryptTotpSecret(encrypted)).toBe(secret);
  });

  it('verifies a generated TOTP code', async () => {
    const secret = createTotpSecret();
    const code = await generateTotpCode(secret);
    expect(await verifyTotpCode(secret, code)).toBe(true);
    expect(await verifyTotpCode(secret, '000000')).toBe(false);
  });

  it('creates hashed recovery codes', () => {
    const { plain, hashes } = createRecoveryCodes(5);
    expect(plain).toHaveLength(5);
    expect(hashes).toHaveLength(5);
    expect(new Set(plain).size).toBe(5);
  });
});
