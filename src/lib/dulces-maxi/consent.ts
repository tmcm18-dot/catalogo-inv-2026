import { readJson } from './storage';

export const CONSENT_KEY = 'dulces_maxi_consent';

export interface ConsentRecord {
  analytics: boolean;
  decided_at: string;
}

export function readConsent(): ConsentRecord | null {
  return readJson<ConsentRecord | null>(CONSENT_KEY, null);
}

export function analyticsAllowed(): boolean {
  return Boolean(readConsent()?.analytics);
}
