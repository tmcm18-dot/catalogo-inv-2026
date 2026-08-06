import argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

let cachedDummyHash: string | null = null;

function asHashString(value: string | Buffer): string {
  return typeof value === 'string' ? value : value.toString('utf8');
}

/** Valid Argon2id hash used to equalize timing when the account does not exist. */
export async function getDummyPasswordHash(): Promise<string> {
  if (cachedDummyHash) return cachedDummyHash;
  cachedDummyHash = asHashString(
    await argon2.hash('__dummy_password_for_timing__', ARGON2_OPTIONS),
  );
  return cachedDummyHash;
}

export async function hashPassword(password: string): Promise<string> {
  return asHashString(await argon2.hash(password, ARGON2_OPTIONS));
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

export function isPasswordLengthValid(password: string): boolean {
  return password.length >= 10 && password.length <= 128;
}
