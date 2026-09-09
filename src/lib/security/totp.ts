import { generate, generateSecret, generateURI, verify } from 'otplib';
import { createSecureToken, hashToken } from '@/lib/security/tokens';
import { decryptSecret, encryptSecret } from '@/lib/security/crypto-box';

const ISSUER = 'Catalogo INV 2026';

export function createTotpSecret(): string {
  return generateSecret();
}

export function encryptTotpSecret(secret: string): string {
  return encryptSecret(secret);
}

export function decryptTotpSecret(encrypted: string): string {
  return decryptSecret(encrypted);
}

export function buildTotpUri(secret: string, accountLabel: string): string {
  return generateURI({
    issuer: ISSUER,
    label: accountLabel,
    secret,
  });
}

export async function verifyTotpCode(secret: string, token: string): Promise<boolean> {
  const result = await verify({ secret, token: token.replace(/\s+/g, '') });
  return Boolean(result.valid);
}

export async function generateTotpCode(secret: string): Promise<string> {
  return generate({ secret });
}

export function createRecoveryCodes(count = 10): { plain: string[]; hashes: string[] } {
  const plain = Array.from({ length: count }, () => createSecureToken(10).slice(0, 12).toUpperCase());
  const hashes = plain.map((code) => hashToken(code));
  return { plain, hashes };
}
