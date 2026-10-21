import { isBrowser, readJson, writeJson } from './storage';

export const ADMIN_ACCOUNT_KEY = 'dulces_maxi_admin_account_v1';
export const ADMIN_SESSION_KEY = 'dulces_maxi_admin_session_v1';
export const ADMIN_AUTH_EVENT = 'dulces_maxi_admin_auth';

export interface AdminAccount {
  email: string;
  salt: string;
  hash: string;
  created_at: string;
}

export interface AdminSession {
  email: string;
  created_at: string;
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(digest);
}

export function readAccount(): AdminAccount | null {
  const account = readJson<AdminAccount | null>(ADMIN_ACCOUNT_KEY, null);
  return account?.email && account.hash ? account : null;
}

export function hasAdminAccount(): boolean {
  return Boolean(readAccount());
}

export async function createAdminAccount(email: string, password: string): Promise<AdminAccount> {
  if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
  const normalized = normalizeEmail(email);
  if (!normalized.includes('@')) throw new Error('Ingresá un email válido.');
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const account: AdminAccount = {
    email: normalized,
    salt,
    hash: await hashPassword(password, salt),
    created_at: new Date().toISOString(),
  };
  writeJson(ADMIN_ACCOUNT_KEY, account, ADMIN_AUTH_EVENT);
  return account;
}

export async function verifyAdmin(email: string, password: string): Promise<boolean> {
  const account = readAccount();
  if (!account) return false;
  if (account.email !== normalizeEmail(email)) return false;
  const hash = await hashPassword(password, account.salt);
  return hash === account.hash;
}

export function readSession(): AdminSession | null {
  if (!isBrowser()) return null;
  const session = readJson<AdminSession | null>(ADMIN_SESSION_KEY, null);
  return session?.email ? session : null;
}

export function writeSession(email: string): AdminSession {
  const session: AdminSession = { email: normalizeEmail(email), created_at: new Date().toISOString() };
  writeJson(ADMIN_SESSION_KEY, session, ADMIN_AUTH_EVENT);
  return session;
}

export function clearSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
}

export function resetAdminAccount(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ADMIN_ACCOUNT_KEY);
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
}

export function safeAdminNext(raw: string | null | undefined, base: string): string {
  const fallback = `${base}/admin`;
  if (!raw) return fallback;
  try {
    const url = new URL(raw, 'https://dulces-maxi.local');
    const path = `${url.pathname}${url.search}`;
    if (!path.startsWith(`${base}/admin`)) return fallback;
    if (path.includes('\\') || path.startsWith('//')) return fallback;
    if (path.includes('iniciar-sesion') || path.includes('olvide-contrasena')) return fallback;
    return path;
  } catch {
    return fallback;
  }
}
