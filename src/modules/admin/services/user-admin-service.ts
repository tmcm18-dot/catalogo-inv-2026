import { RoleCode, UserStatus, AuditResult, type Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { REAUTH_SCOPES } from '@/modules/authorization/permissions';
import { recordAudit } from '@/modules/audit/services/audit-service';
import {
  assertAdminReason,
  assertCanManageTargetUser,
  assertNotLastSuperAdmin,
  assertNotSelfPrivilegeEscalation,
  isPrivilegedAdmin,
  isSuperAdmin,
} from '@/modules/admin/policies/admin-guards';
import { consumeSensitiveActionGrant } from '@/modules/auth/services/reauth-service';
import {
  revokeAllUserSessions,
  type ValidSession,
} from '@/modules/auth/services/session-service';

export type AdminUserListFilters = {
  q?: string;
  status?: UserStatus;
  role?: RoleCode;
  take?: number;
  skip?: number;
};

function sanitizeUser(user: {
  id: string;
  email: string | null;
  phone: string | null;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  blockedUntil: Date | null;
  suspendedAt: Date | null;
  suspendedReason: string | null;
  createdAt: Date;
  profile: { firstName: string; lastName: string; preferredName: string | null } | null;
  userRoles: Array<{
    assignedAt: Date;
    expiresAt: Date | null;
    role: { code: RoleCode; name: string };
  }>;
  twoFactorMethods: Array<{ type: string; verifiedAt: Date | null; disabledAt: Date | null }>;
}) {
  const now = new Date();
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    blockedUntil: user.blockedUntil,
    suspendedAt: user.suspendedAt,
    suspendedReason: user.suspendedReason,
    createdAt: user.createdAt,
    firstName: user.profile?.firstName ?? null,
    lastName: user.profile?.lastName ?? null,
    preferredName: user.profile?.preferredName ?? null,
    roles: user.userRoles.map((ur) => ({
      code: ur.role.code,
      name: ur.role.name,
      assignedAt: ur.assignedAt,
      expiresAt: ur.expiresAt,
      expired: Boolean(ur.expiresAt && ur.expiresAt <= now),
    })),
    activeRoles: user.userRoles
      .filter((ur) => !ur.expiresAt || ur.expiresAt > now)
      .map((ur) => ur.role.code),
    twoFactorEnabled: user.twoFactorMethods.some(
      (m) => m.verifiedAt && !m.disabledAt,
    ),
  };
}

const userInclude = {
  profile: true,
  userRoles: { include: { role: true } },
  twoFactorMethods: {
    where: { type: 'TOTP' },
    select: { type: true, verifiedAt: true, disabledAt: true },
  },
} satisfies Prisma.UserInclude;

export async function listAdminUsers(filters: AdminUserListFilters) {
  const take = Math.min(filters.take ?? 50, 100);
  const skip = filters.skip ?? 0;
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
  };

  if (filters.status) where.status = filters.status;
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
      { profile: { firstName: { contains: q, mode: 'insensitive' } } },
      { profile: { lastName: { contains: q, mode: 'insensitive' } } },
    ];
  }
  if (filters.role) {
    where.userRoles = {
      some: {
        role: { code: filters.role },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    };
  }

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: userInclude,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
  ]);

  return { total, take, skip, users: rows.map(sanitizeUser) };
}

export async function getAdminUserDetail(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: userInclude,
  });
  if (!user) throw new ForbiddenError('NOT_FOUND', 'Usuario no encontrado.');

  const recentSessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      lastActivityAt: true,
      expiresAt: true,
      revokedAt: true,
      revokeReason: true,
      isAdminContext: true,
      twoFactorOk: true,
      deviceName: true,
      rememberMe: true,
    },
  });

  const roleHistory = await prisma.auditLog.findMany({
    where: {
      resourceType: 'user',
      resourceId: userId,
      action: { startsWith: 'admin.' },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      action: true,
      result: true,
      reason: true,
      createdAt: true,
      actorUserId: true,
      metadata: true,
    },
  });

  return {
    user: sanitizeUser(user),
    sessions: recentSessions,
    history: roleHistory,
  };
}

export async function activatePendingUser(input: {
  actor: ValidSession;
  targetUserId: string;
  reason: string;
  requestId?: string;
  ipHash?: string;
  userAgentHash?: string;
}) {
  const reason = assertAdminReason(input.reason);
  await assertCanManageTargetUser({
    actor: input.actor,
    targetUserId: input.targetUserId,
    action: 'admin.user.activate',
    requestId: input.requestId,
  });

  const updated = await prisma.user.updateMany({
    where: {
      id: input.targetUserId,
      status: UserStatus.PENDING_VERIFICATION,
      deletedAt: null,
    },
    data: {
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });
  if (updated.count === 0) {
    throw new ValidationError('El usuario no está pendiente de verificación.');
  }

  await recordAudit({
    actorUserId: input.actor.userId,
    action: 'admin.user.activate',
    resourceType: 'user',
    resourceId: input.targetUserId,
    result: AuditResult.SUCCESS,
    requestId: input.requestId,
    reason,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
  });
}

export async function suspendUser(input: {
  actor: ValidSession;
  targetUserId: string;
  reason: string;
  grantToken?: string;
  requestId?: string;
  ipHash?: string;
  userAgentHash?: string;
}) {
  const reason = assertAdminReason(input.reason);
  await assertNotSelfPrivilegeEscalation({
    actorUserId: input.actor.userId,
    targetUserId: input.targetUserId,
    action: 'admin.user.suspend',
    requestId: input.requestId,
  });
  const target = await assertCanManageTargetUser({
    actor: input.actor,
    targetUserId: input.targetUserId,
    action: 'admin.user.suspend',
    requestId: input.requestId,
  });

  if (isPrivilegedAdmin(target.roles)) {
    if (!input.grantToken) {
      throw new ForbiddenError(
        'REAUTH_REQUIRED',
        'Se requiere reautenticación para suspender administradores.',
      );
    }
    await consumeSensitiveActionGrant({
      session: input.actor,
      grantToken: input.grantToken,
      expectedScope: REAUTH_SCOPES.USERS_SUSPEND_ADMIN,
      requestId: input.requestId,
    });
  }

  await assertNotLastSuperAdmin({
    targetUserId: input.targetUserId,
    actorUserId: input.actor.userId,
    action: 'admin.user.suspend',
    wouldRemoveSuperRole: isSuperAdmin(target.roles),
    requestId: input.requestId,
  });

  await prisma.user.update({
    where: { id: input.targetUserId },
    data: {
      status: UserStatus.SUSPENDED,
      suspendedAt: new Date(),
      suspendedReason: reason,
      blockedUntil: null,
    },
  });

  await revokeAllUserSessions(input.targetUserId, 'ACCOUNT_SUSPENDED', undefined, {
    actorUserId: input.actor.userId,
    requestId: input.requestId,
  });

  await recordAudit({
    actorUserId: input.actor.userId,
    action: 'admin.user.suspend',
    resourceType: 'user',
    resourceId: input.targetUserId,
    result: AuditResult.SUCCESS,
    requestId: input.requestId,
    reason,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
    metadata: { previousStatus: target.status },
  });
}

export async function reactivateUser(input: {
  actor: ValidSession;
  targetUserId: string;
  reason: string;
  requestId?: string;
  ipHash?: string;
  userAgentHash?: string;
}) {
  const reason = assertAdminReason(input.reason);
  const target = await assertCanManageTargetUser({
    actor: input.actor,
    targetUserId: input.targetUserId,
    action: 'admin.user.reactivate',
    requestId: input.requestId,
  });

  await prisma.user.update({
    where: { id: input.targetUserId },
    data: {
      status: UserStatus.ACTIVE,
      suspendedAt: null,
      suspendedReason: null,
      blockedUntil: null,
    },
  });

  await recordAudit({
    actorUserId: input.actor.userId,
    action: 'admin.user.reactivate',
    resourceType: 'user',
    resourceId: input.targetUserId,
    result: AuditResult.SUCCESS,
    requestId: input.requestId,
    reason,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
    metadata: { previousStatus: target.status },
  });
}

export async function temporarilyBlockUser(input: {
  actor: ValidSession;
  targetUserId: string;
  reason: string;
  minutes?: number;
  grantToken?: string;
  requestId?: string;
  ipHash?: string;
  userAgentHash?: string;
}) {
  const reason = assertAdminReason(input.reason);
  await assertNotSelfPrivilegeEscalation({
    actorUserId: input.actor.userId,
    targetUserId: input.targetUserId,
    action: 'admin.user.block',
    requestId: input.requestId,
  });
  const target = await assertCanManageTargetUser({
    actor: input.actor,
    targetUserId: input.targetUserId,
    action: 'admin.user.block',
    requestId: input.requestId,
  });

  if (isPrivilegedAdmin(target.roles)) {
    if (!input.grantToken) {
      throw new ForbiddenError(
        'REAUTH_REQUIRED',
        'Se requiere reautenticación para bloquear administradores.',
      );
    }
    await consumeSensitiveActionGrant({
      session: input.actor,
      grantToken: input.grantToken,
      expectedScope: REAUTH_SCOPES.USERS_SUSPEND_ADMIN,
      requestId: input.requestId,
    });
  }

  const minutes = Math.min(Math.max(input.minutes ?? 15, 5), 24 * 60);
  const blockedUntil = new Date(Date.now() + minutes * 60 * 1000);

  await prisma.user.update({
    where: { id: input.targetUserId },
    data: {
      status: UserStatus.TEMPORARILY_BLOCKED,
      blockedUntil,
    },
  });

  await recordAudit({
    actorUserId: input.actor.userId,
    action: 'admin.user.block',
    resourceType: 'user',
    resourceId: input.targetUserId,
    result: AuditResult.SUCCESS,
    requestId: input.requestId,
    reason,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
    metadata: { blockedUntil: blockedUntil.toISOString(), minutes },
  });
}

export async function assignUserRole(input: {
  actor: ValidSession;
  targetUserId: string;
  roleCode: RoleCode;
  expiresAt?: Date | null;
  reason: string;
  grantToken: string;
  requestId?: string;
  ipHash?: string;
  userAgentHash?: string;
}) {
  const reason = assertAdminReason(input.reason);
  await assertNotSelfPrivilegeEscalation({
    actorUserId: input.actor.userId,
    targetUserId: input.targetUserId,
    action: 'admin.role.assign',
    requestId: input.requestId,
  });
  await assertCanManageTargetUser({
    actor: input.actor,
    targetUserId: input.targetUserId,
    action: 'admin.role.assign',
    requestId: input.requestId,
  });

  await consumeSensitiveActionGrant({
    session: input.actor,
    grantToken: input.grantToken,
    expectedScope: REAUTH_SCOPES.ROLES_MANAGE,
    requestId: input.requestId,
  });

  if (
    input.roleCode === RoleCode.SUPERADMIN &&
    !isSuperAdmin(input.actor.user.roles)
  ) {
    throw new ForbiddenError();
  }

  const role = await prisma.role.findUniqueOrThrow({
    where: { code: input.roleCode },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: input.targetUserId, roleId: role.id },
    },
    update: {
      expiresAt: input.expiresAt ?? null,
      assignedBy: input.actor.userId,
      assignedAt: new Date(),
    },
    create: {
      userId: input.targetUserId,
      roleId: role.id,
      expiresAt: input.expiresAt ?? null,
      assignedBy: input.actor.userId,
    },
  });

  await recordAudit({
    actorUserId: input.actor.userId,
    action: 'admin.role.assign',
    resourceType: 'user',
    resourceId: input.targetUserId,
    result: AuditResult.SUCCESS,
    requestId: input.requestId,
    reason,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
    metadata: {
      role: input.roleCode,
      expiresAt: input.expiresAt?.toISOString() ?? null,
    },
  });
}

export async function revokeUserRole(input: {
  actor: ValidSession;
  targetUserId: string;
  roleCode: RoleCode;
  reason: string;
  grantToken: string;
  requestId?: string;
  ipHash?: string;
  userAgentHash?: string;
}) {
  const reason = assertAdminReason(input.reason);
  await assertNotSelfPrivilegeEscalation({
    actorUserId: input.actor.userId,
    targetUserId: input.targetUserId,
    action: 'admin.role.revoke',
    requestId: input.requestId,
  });
  await assertCanManageTargetUser({
    actor: input.actor,
    targetUserId: input.targetUserId,
    action: 'admin.role.revoke',
    requestId: input.requestId,
  });

  await consumeSensitiveActionGrant({
    session: input.actor,
    grantToken: input.grantToken,
    expectedScope: REAUTH_SCOPES.ROLES_MANAGE,
    requestId: input.requestId,
  });

  await assertNotLastSuperAdmin({
    targetUserId: input.targetUserId,
    actorUserId: input.actor.userId,
    action: 'admin.role.revoke',
    wouldRemoveSuperRole: input.roleCode === RoleCode.SUPERADMIN,
    requestId: input.requestId,
  });

  const role = await prisma.role.findUniqueOrThrow({
    where: { code: input.roleCode },
  });

  await prisma.userRole.deleteMany({
    where: { userId: input.targetUserId, roleId: role.id },
  });

  await recordAudit({
    actorUserId: input.actor.userId,
    action: 'admin.role.revoke',
    resourceType: 'user',
    resourceId: input.targetUserId,
    result: AuditResult.SUCCESS,
    requestId: input.requestId,
    reason,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
    metadata: { role: input.roleCode },
  });
}
