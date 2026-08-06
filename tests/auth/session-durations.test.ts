import { describe, expect, it } from 'vitest';
import { SESSION_DURATIONS } from '@/lib/security/cookies';

describe('session durations', () => {
  it('defines customer and admin windows', () => {
    expect(SESSION_DURATIONS.customer.standard).toBe(7 * 24 * 60 * 60);
    expect(SESSION_DURATIONS.customer.remembered).toBe(30 * 24 * 60 * 60);
    expect(SESSION_DURATIONS.admin.absolute).toBe(8 * 60 * 60);
    expect(SESSION_DURATIONS.admin.inactivity).toBe(20 * 60);
  });
});
