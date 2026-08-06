import { prisma } from '@/lib/db/prisma';
import { ForbiddenError, InvalidOrExpiredTokenError, ValidationError } from '@/lib/errors';
import {
  buildTotpUri,
  createRecoveryCodes,
  createTotpSecret,
  decryptTotpSecret,
  encryptTotpSecret,
  verifyTotpCode,
} from '@/lib/security/totp';
import { hashToken } from '@/lib/security/tokens';
import { recordAudit, recordSecurityEvent } from '@/modules/audit/services/audit-service';
import type { ValidSession } from '@/modules/auth/services/session-service';

export { createRecoveryCodes };

export async function beginTotpSetup(session: ValidSession) {
  const secret = createTotpSecret();
  const encryptedSecret = encryptTotpSecret(secret);

  await prisma.twoFactorMethod.updateMany({
    where: { userId: session.userId, type: 'TOTP', verifiedAt: null },
    data: { disabledAt: new Date() },
  });

  const method = await prisma.twoFactorMethod.create({
    data: {
      userId: session.userId,
      type: 'TOTP',
      encryptedSecret,
    },
  });

  const label = session.user.email ?? session.userId;
  return {
    methodId: method.id,
    secret,
    otpauthUrl: buildTotpUri(secret, label),
  };
}

export async function confirmTotpSetup(session: ValidSession, code: string) {
  const pending = await prisma.twoFactorMethod.findFirst({
    where: {
      userId: session.userId,
      type: 'TOTP',
      verifiedAt: null,
      disabledAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!pending?.encryptedSecret) {
    throw new ValidationError('No hay una configuración 2FA pendiente.');
  }

  const secret = decryptTotpSecret(pending.encryptedSecret);
  const ok = await verifyTotpCode(secret, code);
  if (!ok) throw new ValidationError('Código 2FA inválido.');

  const recovery = createRecoveryCodes(10);

  await prisma.$transaction(async (tx) => {
    await tx.twoFactorMethod.update({
      where: { id: pending.id },
      data: { verifiedAt: new Date() },
    });
    await tx.recoveryCode.deleteMany({ where: { userId: session.userId } });
    await tx.recoveryCode.createMany({
      data: recovery.hashes.map((codeHash) => ({
        userId: session.userId,
        codeHash,
      })),
    });
  });

  await recordSecurityEvent({
    userId: session.userId,
    eventType: '2fa.enabled',
  });
  await recordAudit({
    actorUserId: session.userId,
    action: 'security.2fa.enabled',
    resourceType: 'user',
    resourceId: session.userId,
  });

  return { recoveryCodes: recovery.plain };
}

export async function verifyUserTotp(userId: string, code: string): Promise<boolean> {
  const method = await prisma.twoFactorMethod.findFirst({
    where: {
      userId,
      type: 'TOTP',
      verifiedAt: { not: null },
      disabledAt: null,
    },
  });

  if (!method?.encryptedSecret) return false;
  const secret = decryptTotpSecret(method.encryptedSecret);
  return verifyTotpCode(secret, code);
}

export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const codeHash = hashToken(code.trim().toUpperCase());
  const found = await prisma.recoveryCode.findFirst({
    where: { userId, codeHash, consumedAt: null },
  });
  if (!found) return false;

  await prisma.recoveryCode.update({
    where: { id: found.id },
    data: { consumedAt: new Date() },
  });

  await recordSecurityEvent({
    userId,
    eventType: '2fa.recovery_used',
  });
  return true;
}

export async function disableTotp(session: ValidSession, code: string) {
  const isAdmin =
    session.user.roles.includes('ADMIN') ||
    session.user.roles.includes('SUPERADMIN');
  if (isAdmin) {
    throw new ForbiddenError(
      'FORBIDDEN',
      'La autenticación en dos pasos es obligatoria para cuentas administrativas.',
    );
  }

  const ok =
    (await verifyUserTotp(session.userId, code)) ||
    (await consumeRecoveryCode(session.userId, code));
  if (!ok) throw new InvalidOrExpiredTokenError();

  await prisma.twoFactorMethod.updateMany({
    where: { userId: session.userId, type: 'TOTP', disabledAt: null },
    data: { disabledAt: new Date() },
  });

  await recordAudit({
    actorUserId: session.userId,
    action: 'security.2fa.disabled',
    resourceType: 'user',
    resourceId: session.userId,
  });
}

export async function userRequiresTotp(userId: string): Promise<boolean> {
  const count = await prisma.twoFactorMethod.count({
    where: {
      userId,
      type: 'TOTP',
      verifiedAt: { not: null },
      disabledAt: null,
    },
  });
  return count > 0;
}
