import { AuditResult } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { ForbiddenError } from '@/lib/errors';
import { recordAudit } from '@/modules/audit/services/audit-service';
import {
  requireValidSession,
  type ValidSession,
} from '@/modules/auth/services/session-service';

function activeRoleFilter() {
  return {
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

export async function userHasPermission(
  userId: string,
  permissionCode: string,
): Promise<boolean> {
  const count = await prisma.userRole.count({
    where: {
      userId,
      ...activeRoleFilter(),
      role: {
        permissions: {
          some: { permission: { code: permissionCode } },
        },
      },
    },
  });
  return count > 0;
}

export async function requirePermission(
  permissionCode: string,
): Promise<ValidSession> {
  const session = await requireValidSession();
  const allowed = await userHasPermission(session.userId, permissionCode);

  if (!allowed) {
    await recordAudit({
      actorUserId: session.userId,
      action: 'authorization.denied',
      resourceType: 'permission',
      resourceId: permissionCode,
      result: AuditResult.DENIED,
    });
    throw new ForbiddenError();
  }

  return session;
}

/** Admin session in admin context (2FA may still be pending setup). */
export async function requireAdminSession(): Promise<ValidSession> {
  const session = await requireValidSession();
  const isAdminRole =
    session.user.roles.includes('ADMIN') ||
    session.user.roles.includes('SUPERADMIN');

  if (!isAdminRole || !session.isAdminContext) {
    await recordAudit({
      actorUserId: session.userId,
      action: 'authorization.denied',
      resourceType: 'admin',
      resourceId: 'admin_session',
      result: AuditResult.DENIED,
    });
    throw new ForbiddenError();
  }

  return session;
}

/**
 * Full admin access: RBAC + admin context + completed 2FA.
 * Used by the admin dashboard and sensitive admin APIs.
 */
export async function requireAdminAccess(): Promise<ValidSession> {
  const session = await requirePermission('analytics.read_basic');
  const isAdminRole =
    session.user.roles.includes('ADMIN') ||
    session.user.roles.includes('SUPERADMIN');

  if (!isAdminRole || !session.isAdminContext) {
    await recordAudit({
      actorUserId: session.userId,
      action: 'authorization.denied',
      resourceType: 'admin',
      resourceId: 'admin_shell',
      result: AuditResult.DENIED,
    });
    throw new ForbiddenError();
  }

  if (!session.twoFactorOk) {
    await recordAudit({
      actorUserId: session.userId,
      action: 'authorization.denied',
      resourceType: 'admin',
      resourceId: 'two_factor_required',
      result: AuditResult.DENIED,
    });
    throw new ForbiddenError(
      'TWO_FACTOR_REQUIRED',
      'Debés completar la autenticación en dos pasos.',
    );
  }

  return session;
}

/**
 * Admin access gated by a specific permission + completed 2FA.
 */
export async function requireAdminPermission(
  permissionCode: string,
): Promise<ValidSession> {
  const session = await requireAdminAccess();
  const allowed = await userHasPermission(session.userId, permissionCode);
  if (!allowed) {
    await recordAudit({
      actorUserId: session.userId,
      action: 'authorization.denied',
      resourceType: 'permission',
      resourceId: permissionCode,
      result: AuditResult.DENIED,
    });
    throw new ForbiddenError();
  }
  return session;
}

export function hasAnyRole(
  session: ValidSession,
  roles: Array<'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SUPERADMIN'>,
): boolean {
  return roles.some((role) => session.user.roles.includes(role));
}
