import { SensitiveActionScope } from '@prisma/client';
import {
  REAUTH_SCOPES,
  REAUTH_TTL_SECONDS,
  type ReauthScope,
} from '@/modules/authorization/permissions';
import { prisma } from '@/lib/db/prisma';
import {
  ForbiddenError,
  InvalidOrExpiredTokenError,
  ValidationError,
} from '@/lib/errors';
import { verifyPassword } from '@/lib/security/password';
import { createSecureToken, hashToken } from '@/lib/security/tokens';
import { recordAudit } from '@/modules/audit/services/audit-service';
import { verifyUserTotp } from '@/modules/auth/services/two-factor-service';
import type { ValidSession } from '@/modules/auth/services/session-service';
import { AuditResult } from '@prisma/client';

const SCOPE_TO_PRISMA: Record<ReauthScope, SensitiveActionScope> = {
  [REAUTH_SCOPES.ROLES_MANAGE]: SensitiveActionScope.roles_manage,
  [REAUTH_SCOPES.USERS_SUSPEND_ADMIN]: SensitiveActionScope.users_suspend_admin,
  [REAUTH_SCOPES.SESSIONS_REVOKE_ADMIN]: SensitiveActionScope.sessions_revoke_admin,
  [REAUTH_SCOPES.TWO_FACTOR_DISABLE]: SensitiveActionScope.two_factor_disable,
  [REAUTH_SCOPES.TWO_FACTOR_REGENERATE_RECOVERY_CODES]:
    SensitiveActionScope.two_factor_regenerate_recovery_codes,
  [REAUTH_SCOPES.DATA_EXPORT_SENSITIVE]: SensitiveActionScope.data_export_sensitive,
  [REAUTH_SCOPES.SYSTEM_CONFIGURE]: SensitiveActionScope.system_configure,
};

const PRISMA_TO_SCOPE: Record<SensitiveActionScope, ReauthScope> = {
  [SensitiveActionScope.roles_manage]: REAUTH_SCOPES.ROLES_MANAGE,
  [SensitiveActionScope.users_suspend_admin]: REAUTH_SCOPES.USERS_SUSPEND_ADMIN,
  [SensitiveActionScope.sessions_revoke_admin]: REAUTH_SCOPES.SESSIONS_REVOKE_ADMIN,
  [SensitiveActionScope.two_factor_disable]: REAUTH_SCOPES.TWO_FACTOR_DISABLE,
  [SensitiveActionScope.two_factor_regenerate_recovery_codes]:
    REAUTH_SCOPES.TWO_FACTOR_REGENERATE_RECOVERY_CODES,
  [SensitiveActionScope.data_export_sensitive]: REAUTH_SCOPES.DATA_EXPORT_SENSITIVE,
  [SensitiveActionScope.system_configure]: REAUTH_SCOPES.SYSTEM_CONFIGURE,
};

export function parseReauthScope(raw: string): ReauthScope {
  const values = Object.values(REAUTH_SCOPES) as string[];
  if (!values.includes(raw)) {
    throw new ValidationError('Scope de reautenticación inválido.');
  }
  return raw as ReauthScope;
}

export async function createSensitiveActionGrant(input: {
  session: ValidSession;
  scope: ReauthScope;
  password: string;
  totpCode?: string;
  requestId?: string;
  ipHash?: string;
  userAgentHash?: string;
}): Promise<{ grantToken: string; expiresAt: Date; scope: ReauthScope }> {
  const { session } = input;
  if (!session.isAdminContext) {
    throw new ForbiddenError();
  }

  const credential = await prisma.credential.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  });
  if (!credential) {
    throw new InvalidOrExpiredTokenError();
  }

  const passwordOk = await verifyPassword(credential.passwordHash, input.password);
  if (!passwordOk) {
    await recordAudit({
      actorUserId: session.userId,
      action: 'reauth.denied',
      resourceType: 'sensitive_grant',
      resourceId: input.scope,
      result: AuditResult.DENIED,
      requestId: input.requestId,
      ipHash: input.ipHash,
      userAgentHash: input.userAgentHash,
      reason: 'INVALID_PASSWORD',
    });
    throw new ForbiddenError('REAUTH_FAILED', 'Reautenticación fallida.');
  }

  const isAdmin =
    session.user.roles.includes('ADMIN') ||
    session.user.roles.includes('SUPERADMIN');
  if (isAdmin) {
    if (!input.totpCode) {
      throw new ValidationError('Se requiere un código TOTP para esta acción.');
    }
    const totpOk = await verifyUserTotp(session.userId, input.totpCode);
    if (!totpOk) {
      await recordAudit({
        actorUserId: session.userId,
        action: 'reauth.denied',
        resourceType: 'sensitive_grant',
        resourceId: input.scope,
        result: AuditResult.DENIED,
        requestId: input.requestId,
        ipHash: input.ipHash,
        userAgentHash: input.userAgentHash,
        reason: 'INVALID_TOTP',
      });
      throw new ForbiddenError('REAUTH_FAILED', 'Reautenticación fallida.');
    }
  }

  const prismaScope = SCOPE_TO_PRISMA[input.scope];
  const token = createSecureToken(32);
  const expiresAt = new Date(Date.now() + REAUTH_TTL_SECONDS * 1000);

  // Invalidate prior unused grants for same session+scope.
  await prisma.sensitiveActionGrant.updateMany({
    where: {
      userId: session.userId,
      sessionId: session.sessionId,
      scope: prismaScope,
      consumedAt: null,
    },
    data: { consumedAt: new Date() },
  });

  await prisma.sensitiveActionGrant.create({
    data: {
      userId: session.userId,
      sessionId: session.sessionId,
      tokenHash: hashToken(token),
      scope: prismaScope,
      expiresAt,
    },
  });

  await recordAudit({
    actorUserId: session.userId,
    action: 'reauth.granted',
    resourceType: 'sensitive_grant',
    resourceId: input.scope,
    result: AuditResult.SUCCESS,
    requestId: input.requestId,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
  });

  return { grantToken: token, expiresAt, scope: input.scope };
}

export async function consumeSensitiveActionGrant(input: {
  session: ValidSession;
  grantToken: string;
  expectedScope: ReauthScope;
  requestId?: string;
}): Promise<void> {
  const tokenHash = hashToken(input.grantToken);
  const grant = await prisma.sensitiveActionGrant.findUnique({
    where: { tokenHash },
  });

  const prismaScope = SCOPE_TO_PRISMA[input.expectedScope];
  const valid =
    grant &&
    !grant.consumedAt &&
    grant.expiresAt > new Date() &&
    grant.userId === input.session.userId &&
    grant.sessionId === input.session.sessionId &&
    grant.scope === prismaScope;

  if (!valid || !grant) {
    await recordAudit({
      actorUserId: input.session.userId,
      action: 'reauth.consume_denied',
      resourceType: 'sensitive_grant',
      resourceId: input.expectedScope,
      result: AuditResult.DENIED,
      requestId: input.requestId,
      reason: 'INVALID_OR_EXPIRED_GRANT',
    });
    throw new ForbiddenError(
      'REAUTH_REQUIRED',
      'Se requiere reautenticación reciente para esta acción.',
    );
  }

  await prisma.sensitiveActionGrant.update({
    where: { id: grant.id },
    data: { consumedAt: new Date() },
  });
}

export {
  invalidateGrantsForSession,
  invalidateGrantsForUser,
} from '@/modules/auth/services/grant-invalidation';

export function scopeLabel(scope: SensitiveActionScope): ReauthScope {
  return PRISMA_TO_SCOPE[scope];
}
