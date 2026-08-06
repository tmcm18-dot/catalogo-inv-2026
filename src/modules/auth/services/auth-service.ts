import { RoleCode, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import {
  ConflictError,
  InvalidCredentialsError,
  InvalidOrExpiredTokenError,
  RateLimitedError,
  ValidationError,
} from '@/lib/errors';
import { normalizeEmail, normalizeIdentifier, normalizePhone } from '@/lib/security/identifiers';
import {
  getDummyPasswordHash,
  hashPassword,
  isPasswordLengthValid,
  verifyPassword,
} from '@/lib/security/password';
import { createSecureToken, hashToken } from '@/lib/security/tokens';
import { checkLoginRisk, recordLoginAttempt } from '@/lib/rate-limit/login-risk';
import { recordAudit, recordSecurityEvent } from '@/modules/audit/services/audit-service';
import {
  sendPasswordResetEmail,
  sendSecurityAlertEmail,
  sendVerificationEmail,
} from '@/modules/auth/services/email-service';
import type { LoginInput, RegisterInput } from '@/modules/auth/schemas/auth-schemas';

async function findUserForAuth(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  return prisma.user.findFirst({
    where:
      normalized.kind === 'email'
        ? { normalizedEmail: normalized.normalized, deletedAt: null }
        : { normalizedPhone: normalized.normalized, deletedAt: null },
    include: {
      credentials: { orderBy: { createdAt: 'desc' }, take: 1 },
      userRoles: { include: { role: true } },
      twoFactorMethods: {
        where: { disabledAt: null, verifiedAt: { not: null }, type: 'TOTP' },
        take: 1,
      },
      profile: true,
    },
  });
}

export async function registerCustomer(input: RegisterInput) {
  if (!isPasswordLengthValid(input.password)) {
    throw new ValidationError('La contraseña debe tener entre 10 y 128 caracteres.');
  }

  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ normalizedEmail: email }, { normalizedPhone: phone }],
      deletedAt: null,
    },
  });

  if (existing) {
    // Generic conflict — do not reveal which field collided.
    throw new ConflictError('No fue posible completar el registro con los datos proporcionados.');
  }

  const customerRole = await prisma.role.findUnique({ where: { code: RoleCode.CUSTOMER } });
  if (!customerRole) {
    throw new Error('CUSTOMER role missing — run prisma seed');
  }

  const passwordHash = await hashPassword(input.password);
  const verifyToken = createSecureToken(32);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: input.email.trim(),
        normalizedEmail: email,
        phone: input.phone.trim(),
        normalizedPhone: phone,
        status: UserStatus.PENDING_VERIFICATION,
        profile: {
          create: {
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
          },
        },
        credentials: {
          create: { passwordHash },
        },
        userRoles: {
          create: { roleId: customerRole.id },
        },
        consentRecords: {
          create: [
            { kind: 'terms', granted: true, version: '1' },
            { kind: 'privacy', granted: true, version: '1' },
            {
              kind: 'marketing',
              granted: Boolean(input.marketingConsent),
              version: '1',
            },
          ],
        },
        emailVerificationTokens: {
          create: {
            tokenHash: hashToken(verifyToken),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
      },
    });
    return created;
  });

  await sendVerificationEmail({ to: email, token: verifyToken });
  await recordAudit({
    actorUserId: user.id,
    action: 'auth.register',
    resourceType: 'user',
    resourceId: user.id,
  });

  return { userId: user.id };
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) throw new InvalidOrExpiredTokenError();

  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    await tx.user.update({
      where: { id: record.userId },
      data: {
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    });
  });

  await recordSecurityEvent({
    userId: record.userId,
    eventType: 'email.verified',
  });

  return { userId: record.userId };
}

export async function authenticateUser(
  input: LoginInput,
  meta: { ipHash: string; userAgent?: string | null; adminContext?: boolean },
) {
  const identifier = normalizeIdentifier(input.identifier);
  const identifierHash = hashToken(identifier.normalized);
  const user = await findUserForAuth(input.identifier);

  const risk = await checkLoginRisk({
    ipHash: meta.ipHash,
    identifierHash,
    userId: user?.id,
  });

  if (!risk.allowed) {
    throw new RateLimitedError(risk.retryAfterSeconds);
  }

  const fallbackHash = await getDummyPasswordHash();
  const storedHash = user?.credentials[0]?.passwordHash ?? fallbackHash;
  const passwordIsValid = await verifyPassword(storedHash, input.password);

  if (!user || !passwordIsValid || user.status !== UserStatus.ACTIVE) {
    await recordLoginAttempt({
      identifierHash,
      ipHash: meta.ipHash,
      success: false,
      userId: user?.id,
    });
    await recordSecurityEvent({
      userId: user?.id,
      eventType: 'login.failed',
    });
    throw new InvalidCredentialsError();
  }

  const now = new Date();
  const roles = user.userRoles
    .filter((ur) => !ur.expiresAt || ur.expiresAt > now)
    .map((ur) => ur.role.code);
  const isAdminRole =
    roles.includes(RoleCode.ADMIN) || roles.includes(RoleCode.SUPERADMIN);

  if (meta.adminContext && !isAdminRole) {
    await recordLoginAttempt({
      identifierHash,
      ipHash: meta.ipHash,
      success: false,
      userId: user.id,
    });
    throw new InvalidCredentialsError();
  }

  if (!meta.adminContext && isAdminRole && !roles.includes(RoleCode.CUSTOMER)) {
    // Admins should use /admin/iniciar-sesion; still return generic error.
    await recordLoginAttempt({
      identifierHash,
      ipHash: meta.ipHash,
      success: false,
      userId: user.id,
    });
    throw new InvalidCredentialsError();
  }

  await recordLoginAttempt({
    identifierHash,
    ipHash: meta.ipHash,
    success: true,
    userId: user.id,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const requiresTwoFactor =
    Boolean(meta.adminContext) &&
    (isAdminRole || user.twoFactorMethods.length > 0);

  return {
    user,
    roles,
    requiresTwoFactor,
    hasTotp: user.twoFactorMethods.length > 0,
  };
}

export async function requestPasswordReset(identifier: string, ipHash?: string) {
  const normalized = normalizeIdentifier(identifier);
  const user = await findUserForAuth(identifier);

  // Always same outward behavior.
  if (!user || !user.email) {
    return { ok: true as const };
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const token = createSecureToken(32);
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      requestedIpHash: ipHash ?? null,
    },
  });

  await sendPasswordResetEmail({ to: user.email, token });
  await recordSecurityEvent({
    userId: user.id,
    eventType: 'password_reset.requested',
    metadata: { kind: normalized.kind },
  });

  return { ok: true as const };
}

export async function resetPasswordWithToken(input: {
  token: string;
  password: string;
}) {
  if (!isPasswordLengthValid(input.password)) {
    throw new ValidationError('La contraseña debe tener entre 10 y 128 caracteres.');
  }

  const tokenHash = hashToken(input.token);
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!resetToken) {
    throw new InvalidOrExpiredTokenError();
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction(async (tx) => {
    await tx.credential.updateMany({
      where: { userId: resetToken.userId },
      data: {
        passwordHash,
        passwordSetAt: new Date(),
      },
    });

    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { consumedAt: new Date() },
    });

    await tx.session.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokeReason: 'PASSWORD_RESET',
      },
    });
  });

  const user = await prisma.user.findUnique({ where: { id: resetToken.userId } });
  if (user?.email) {
    await sendSecurityAlertEmail({
      to: user.email,
      subject: 'Tu contraseña fue actualizada',
      text: 'Se restableció la contraseña de tu cuenta. Si no fuiste vos, contactá soporte de inmediato.',
    });
  }

  await recordSecurityEvent({
    userId: resetToken.userId,
    eventType: 'password_reset.completed',
  });
}

export async function createAdminChallenge(userId: string): Promise<string> {
  const token = createSecureToken(32);
  await prisma.pendingAdminChallenge.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  return token;
}

export async function consumeAdminChallenge(token: string) {
  const challenge = await prisma.pendingAdminChallenge.findFirst({
    where: {
      tokenHash: hashToken(token),
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        include: {
          twoFactorMethods: {
            where: { disabledAt: null, verifiedAt: { not: null }, type: 'TOTP' },
            take: 1,
          },
          userRoles: { include: { role: true } },
        },
      },
    },
  });

  if (!challenge) throw new InvalidOrExpiredTokenError();
  return challenge;
}

export async function deleteAdminChallenge(id: string) {
  await prisma.pendingAdminChallenge.delete({ where: { id } }).catch(() => undefined);
}
