import { describe, expect, it } from 'vitest';
import {
  maskEmail,
  maskPhone,
  normalizeEmail,
  normalizeIdentifier,
  normalizePhone,
} from '@/lib/security/identifiers';

describe('identifiers', () => {
  it('normalizes email', () => {
    expect(normalizeEmail('  Ada@Example.COM ')).toBe('ada@example.com');
  });

  it('normalizes phone to digits', () => {
    expect(normalizePhone('+54 9 387 610-6268')).toBe('5493876106268');
  });

  it('detects identifier kind', () => {
    expect(normalizeIdentifier('user@example.com').kind).toBe('email');
    expect(normalizeIdentifier('+5491112345678').kind).toBe('phone');
  });

  it('masks email and phone', () => {
    expect(maskEmail('ada@example.com')).toBe('ad***@example.com');
    expect(maskPhone('+5491112345678')).toBe('******5678');
  });
});
