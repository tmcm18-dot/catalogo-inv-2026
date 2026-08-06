import { RoleCode, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { AuditResult } from '@prisma/client';
import { recordAudit } from '@/modules/audit/services/audit-service';
import type { ValidSession } from '@/modules/auth/services/session-service';

export type TargetUserRoles = {
  id: string;
  status: UserStatus;
  roles: RoleCode[];
};

export async function loadTargetUserRoles(userId: string): Promise<TargetUserRoles | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: { role: true },
      },
    },
  });
  if (!user || user.deletedAt) return null;

  const now = new Date();
  const roles = user.userRoles
    .filter((ur) => !ur.expiresAt || ur.expiresAt > now)
    .map((ur) => ur.role.code);

  return { id: user.id, status: user.status, roles };
}

export function isPrivilegedAdmin(roles: RoleCode[]): boolean {
  return roles.includes(RoleCode.ADMIN) || roles.includes(RoleCode.SUPERADMIN);
}

export function isSuperAdmin(roles: RoleCode[]): boolean {
  return roles.includes(RoleCode.SUPERADMIN);
}

/**
 * Prevents ADMIN from managing SUPERADMIN targets, and anyone from
 * elevating themselves. Server-side only.
 */
export async function assertCanManageTargetUser(input: {
  actor: ValidSession;
  targetUserId: string;
  action: string;
  requestId?: string;
}): Promise<TargetUserRoles> {
  const target = await loadTargetUserRoles(input.targetUserId);
  if (!target) {
    throw new ForbiddenError('NOT_FOUND', 'Usuario no encontrado.');
  }

  const actorIsSuper = isSuperAdmin(input.actor.user.roles);
  const targetIsSuper = isSuperAdmin(target.roles);

  if (!actorIsSuper && targetIsSuper) {
    await recordAudit({
      actorUserId: input.actor.userId,
      action: input.action,
      resourceType: 'user',
      resourceId: target.id,
      result: AuditResult.DENIED,
      requestId: input.requestId,
      reason: 'ADMIN_CANNOT_MANAGE_SUPERADMIN',
    });
    throw new ForbiddenError(
      'FORBIDDEN',
      'Un administrador no puede gestionar cuentas de superadministrador.',
    );
  }

  return target;
}

export async function assertNotSelfPrivilegeEscalation(input: {
  actorUserId: string;
  targetUserId: string;
  action: string;
  requestId?: string;
}): Promise<void> {
  if (input.actorUserId === input.targetUserId) {
    await recordAudit({
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: 'user',
      resourceId: input.targetUserId,
      result: AuditResult.DENIED,
      requestId: input.requestId,
      reason: 'SELF_PRIVILEGE_ESCALATION',
    });
    throw new ForbiddenError(
      'FORBIDDEN',
      'No podés modificar tus propios privilegios de esta forma.',
    );
  }
}

export async function countActiveSuperAdmins(): Promise<number> {
  return prisma.userRole.count({
    where: {
      role: { code: RoleCode.SUPERADMIN },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      user: {
        deletedAt: null,
        status: { in: [UserStatus.ACTIVE, UserStatus.TEMPORARILY_BLOCKED] },
      },
    },
  });
}

/**
 * Blocks suspending/removing/degrading the last active SUPERADMIN.
 */
export async function assertNotLastSuperAdmin(input: {
  targetUserId: string;
  actorUserId: string;
  action: string;
  wouldRemoveSuperRole: boolean;
  requestId?: string;
}): Promise<void> {
  if (!input.wouldRemoveSuperRole) return;

  const target = await loadTargetUserRoles(input.targetUserId);
  if (!target || !isSuperAdmin(target.roles)) return;

  const count = await countActiveSuperAdmins();
  if (count <= 1) {
    await recordAudit({
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: 'user',
      resourceId: input.targetUserId,
      result: AuditResult.DENIED,
      requestId: input.requestId,
      reason: 'LAST_SUPERADMIN',
    });
    throw new ForbiddenError(
      'LAST_SUPERADMIN',
      'No se puede suspender, degradar ni eliminar al último superadministrador activo.',
    );
  }
}

export function assertAdminReason(reason: string | undefined | null): string {
  const trimmed = reason?.trim() ?? '';
  if (trimmed.length < 5 || trimmed.length > 500) {
    throw new ValidationError(
      'Las acciones administrativas críticas requieren una razón (5–500 caracteres).',
    );
  }
  return trimmed;
}
