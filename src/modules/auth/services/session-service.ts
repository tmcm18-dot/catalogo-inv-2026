import { cookies } from 'next/headers';
import type { RoleCode, User, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import {
  SESSION_DURATIONS,
  getSessionCookieName,
  sessionCookieOptions,
} from '@/lib/security/cookies';
import { createSecureToken, hashToken } from '@/lib/security/tokens';
import { UnauthorizedError } from '@/lib/errors';

export type SessionUser = {
  id: string;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  roles: RoleCode[];
  permissions: string[];
  firstName?: string;
  lastName?: string;
};

export type ValidSession = {
  sessionId: string;
  userId: string;
  isAdminContext: boolean;
  twoFactorOk: boolean;
  rememberMe: boolean;
  user: SessionUser;
};

function computeExpiry(input: {
  isAdminContext: boolean;
  rememberMe: boolean;
}): Date {
  const seconds = input.isAdminContext
    ? SESSION_DURATIONS.admin.absolute
    : input.rememberMe
      ? SESSION_DURATIONS.customer.remembered
      : SESSION_DURATIONS.customer.standard;
  return new Date(Date.now() + seconds * 1000);
}

async function loadSessionUser(userId: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      userRoles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  if (!user || user.deletedAt || user.status === 'DELETED') return null;

  const now = new Date();
  const activeRoles = user.userRoles.filter(
    (ur) => !ur.expiresAt || ur.expiresAt > now,
  );
  const roles = activeRoles.map((ur) => ur.role.code);
  const permissions = Array.from(
    new Set(
      activeRoles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.code),
      ),
    ),
  );

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    status: user.status,
    roles,
    permissions,
    firstName: user.profile?.firstName,
    lastName: user.profile?.lastName,
  };
}

export async function createSession(input: {
  userId: string;
  rememberMe?: boolean;
  isAdminContext?: boolean;
  twoFactorOk?: boolean;
  userAgent?: string | null;
  ip?: string | null;
}): Promise<{ token: string; expiresAt: Date }> {
  const token = createSecureToken(32);
  const tokenHash = hashToken(token);
  const isAdminContext = Boolean(input.isAdminContext);
  const rememberMe = Boolean(input.rememberMe);
  const expiresAt = computeExpiry({ isAdminContext, rememberMe });

  await prisma.session.create({
    data: {
      userId: input.userId,
      tokenHash,
      rememberMe,
      isAdminContext,
      twoFactorOk: Boolean(input.twoFactorOk),
      userAgentHash: input.userAgent ? hashToken(input.userAgent) : null,
      ipHash: input.ip ? hashToken(input.ip) : null,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const jar = await cookies();
  jar.set(getSessionCookieName(), token, {
    ...sessionCookieOptions,
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(getSessionCookieName(), '', {
    ...sessionCookieOptions,
    maxAge: 0,
  });
}

export async function readSessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(getSessionCookieName())?.value ?? null;
}

export async function revokeSessionByToken(
  token: string,
  reason: string,
): Promise<void> {
  await prisma.session.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date(), revokeReason: reason },
  });
}

export async function revokeAllUserSessions(
  userId: string,
  reason: string,
  exceptSessionId?: string,
): Promise<void> {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date(), revokeReason: reason },
  });
}

export async function requireValidSession(): Promise<ValidSession> {
  const token = await readSessionToken();
  if (!token) throw new UnauthorizedError();

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new UnauthorizedError();
  }

  if (session.isAdminContext) {
    const inactiveMs = Date.now() - session.lastActivityAt.getTime();
    if (inactiveMs > SESSION_DURATIONS.admin.inactivity * 1000) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), revokeReason: 'ADMIN_INACTIVITY' },
      });
      throw new UnauthorizedError('La sesión administrativa expiró por inactividad.');
    }
  }

  const user = await loadSessionUser(session.userId);
  if (!user || user.status !== 'ACTIVE') {
    throw new UnauthorizedError();
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() },
  });

  return {
    sessionId: session.id,
    userId: session.userId,
    isAdminContext: session.isAdminContext,
    twoFactorOk: session.twoFactorOk,
    rememberMe: session.rememberMe,
    user,
  };
}

export async function getOptionalSession(): Promise<ValidSession | null> {
  try {
    return await requireValidSession();
  } catch {
    return null;
  }
}

export async function rotateSession(input: {
  oldToken: string | null;
  userId: string;
  rememberMe?: boolean;
  isAdminContext?: boolean;
  twoFactorOk?: boolean;
  userAgent?: string | null;
  ip?: string | null;
}): Promise<{ token: string; expiresAt: Date }> {
  if (input.oldToken) {
    await revokeSessionByToken(input.oldToken, 'SESSION_ROTATED');
  }
  return createSession({
    userId: input.userId,
    rememberMe: input.rememberMe,
    isAdminContext: input.isAdminContext,
    twoFactorOk: input.twoFactorOk,
    userAgent: input.userAgent,
    ip: input.ip,
  });
}

export type { User };
