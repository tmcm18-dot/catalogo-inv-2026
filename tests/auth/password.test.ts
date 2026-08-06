import { describe, expect, it } from 'vitest';
import {
  hashPassword,
  isPasswordLengthValid,
  verifyPassword,
} from '@/lib/security/password';

describe('password', () => {
  it('accepts lengths between 10 and 128', () => {
    expect(isPasswordLengthValid('short')).toBe(false);
    expect(isPasswordLengthValid('1234567890')).toBe(true);
    expect(isPasswordLengthValid('a'.repeat(128))).toBe(true);
    expect(isPasswordLengthValid('a'.repeat(129))).toBe(false);
  });

  it('hashes and verifies with Argon2id', async () => {
    const hash = await hashPassword('frase-larga-segura');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, 'frase-larga-segura')).toBe(true);
    expect(await verifyPassword(hash, 'otra-frase')).toBe(false);
  });
});
