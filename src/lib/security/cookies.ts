export const ANONYMOUS_COOKIE_NAME = 'inv2026_anonymous';

export function getSessionCookieName(): string {
  return process.env.NODE_ENV === 'production' ? '__Host-app_session' : 'app_session';
}

export function getAdminChallengeCookieName(): string {
  return process.env.NODE_ENV === 'production'
    ? '__Host-app_admin_challenge'
    : 'app_admin_challenge';
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const anonymousCookieOptions = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 365 * 24 * 60 * 60,
};

export const SESSION_DURATIONS = {
  customer: {
    standard: 7 * 24 * 60 * 60,
    remembered: 30 * 24 * 60 * 60,
  },
  admin: {
    absolute: 8 * 60 * 60,
    inactivity: 20 * 60,
  },
} as const;
