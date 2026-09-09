import { AuditResult } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { ForbiddenError } from '@/lib/errors';
import { REAUTH_SCOPES } from '@/modules/authorization/permissions';
import { recordAudit } from '@/modules/audit/services/audit-service';
import {
  assertAdminReason,
  assertCanManageTargetUser,
  isPrivilegedAdmin,
  loadTargetUserRoles,
} from '@/modules/admin/policies/admin-guards';
import { consumeSensitiveActionGrant } from '@/modules/auth/services/reauth-service';
import {
  revokeAllUserSessions,
  type ValidSession,
} from '@/modules/auth/services/session-service';

export async function listAdminSessions(input: {
  userId?: string;
  includeRevoked?: boolean;
  take?: number;
}) {
  const take = Math.min(input.take ?? 50, 100);
  const sessions = await prisma.session.findMany({
    where: {
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.includeRevoked
        ? {}
        : { revokedAt: null, expiresAt: { gt: new Date() } }),
    },
    orderBy: { lastActivityAt: 'desc' },
    take,
    select: {
      id: true,
      userId: true,
      createdAt: true,
      lastActivityAt: true,
      expiresAt: true,
      revokedAt: true,
      revokeReason: true,
      isAdminContext: true,
      twoFactorOk: true,
      deviceName: true,
      rememberMe: true,
      user: {
        select: {
          email: true,
          status: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    userId: s.userId,
    email: s.user.email,
    userName: s.user.profile
      ? `${s.user.profile.firstName} ${s.user.profile.lastName}`
      : null,
    userStatus: s.user.status,
    createdAt: s.createdAt,
    lastActivityAt: s.lastActivityAt,
    expiresAt: s.expiresAt,
    revokedAt: s.revokedAt,
    revokeReason: s.revokeReason,
    isAdminContext: s.isAdminContext,
    twoFactorOk: s.twoFactorOk,
    deviceName: s.deviceName,
    rememberMe: s.rememberMe,
  }));
}

export async function revokeSessionAsAdmin(input: {
  actor: ValidSession;
  sessionId: string;
  reason: string;
  grantToken?: string;
  requestId?: string;
  ipHash?: string;
  userAgentHash?: string;
}) {
  const reason = assertAdminReason(input.reason);
  const session = await prisma.session.findUnique({
    where: { id: input.sessionId },
  });
  if (!session || session.revokedAt) {
    throw new ForbiddenError('NOT_FOUND', 'Sesión no encontrada.');
  }

  const target = await assertCanManageTargetUser({
    actor: input.actor,
    targetUserId: session.userId,
    action: 'admin.session.revoke',
    requestId: input.requestId,
  });

  if (isPrivilegedAdmin(target.roles) && session.userId !== input.actor.userId) {
    if (!input.grantToken) {
      throw new ForbiddenError(
        'REAUTH_REQUIRED',
        'Se requiere reautenticación para cerrar sesiones de otro administrador.',
      );
    }
    await consumeSensitiveActionGrant({
      session: input.actor,
      grantToken: input.grantToken,
      expectedScope: REAUTH_SCOPES.SESSIONS_REVOKE_ADMIN,
      requestId: input.requestId,
    });
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date(), revokeReason: reason },
  });

  await recordAudit({
    actorUserId: input.actor.userId,
    action: 'admin.session.revoke',
    resourceType: 'session',
    resourceId: session.id,
    result: AuditResult.SUCCESS,
    requestId: input.requestId,
    reason,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
    metadata: { targetUserId: session.userId },
  });
}

export async function revokeAllSessionsAsAdmin(input: {
  actor: ValidSession;
  targetUserId: string;
  reason: string;
  grantToken?: string;
  requestId?: string;
  ipHash?: string;
  userAgentHash?: string;
}) {
  const reason = assertAdminReason(input.reason);
  const target = await assertCanManageTargetUser({
    actor: input.actor,
    targetUserId: input.targetUserId,
    action: 'admin.session.revoke_all',
    requestId: input.requestId,
  });

  if (isPrivilegedAdmin(target.roles) && input.targetUserId !== input.actor.userId) {
    if (!input.grantToken) {
      throw new ForbiddenError(
        'REAUTH_REQUIRED',
        'Se requiere reautenticación para cerrar todas las sesiones de otro administrador.',
      );
    }
    await consumeSensitiveActionGrant({
      session: input.actor,
      grantToken: input.grantToken,
      expectedScope: REAUTH_SCOPES.SESSIONS_REVOKE_ADMIN,
      requestId: input.requestId,
    });
  }

  const count = await revokeAllUserSessions(
    input.targetUserId,
    reason,
    input.targetUserId === input.actor.userId ? input.actor.sessionId : undefined,
    { actorUserId: input.actor.userId, requestId: input.requestId },
  );

  await recordAudit({
    actorUserId: input.actor.userId,
    action: 'admin.session.revoke_all',
    resourceType: 'user',
    resourceId: input.targetUserId,
    result: AuditResult.SUCCESS,
    requestId: input.requestId,
    reason,
    ipHash: input.ipHash,
    userAgentHash: input.userAgentHash,
    metadata: { count },
  });

  return { count };
}

export async function getSecurityOverview() {
  const [
    activeUsers,
    pendingUsers,
    blockedUsers,
    suspendedUsers,
    adminUsers,
    superUsers,
    activeSessions,
    revokedSessions,
    failedLogins,
    recentAudit,
    twoFactorEvents,
  ] = await Promise.all([
    prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
    prisma.user.count({
      where: { status: 'PENDING_VERIFICATION', deletedAt: null },
    }),
    prisma.user.count({
      where: { status: 'TEMPORARILY_BLOCKED', deletedAt: null },
    }),
    prisma.user.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
    prisma.userRole.count({
      where: {
        role: { code: 'ADMIN' },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
    prisma.userRole.count({
      where: {
        role: { code: 'SUPERADMIN' },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
    prisma.session.count({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
    }),
    prisma.session.count({
      where: { revokedAt: { not: null } },
    }),
    prisma.loginAttempt.count({
      where: {
        success: false,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        action: true,
        result: true,
        resourceType: true,
        resourceId: true,
        createdAt: true,
        actorUserId: true,
        reason: true,
      },
    }),
    prisma.securityEvent.count({
      where: {
        eventType: { in: ['2fa.enabled', '2fa.recovery_used'] },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return {
    users: {
      active: activeUsers,
      pending: pendingUsers,
      temporarilyBlocked: blockedUsers,
      suspended: suspendedUsers,
      admins: adminUsers,
      superadmins: superUsers,
    },
    sessions: {
      active: activeSessions,
      revoked: revokedSessions,
    },
    risk: {
      failedLogins24h: failedLogins,
      twoFactorEvents7d: twoFactorEvents,
    },
    recentAudit,
  };
}

export async function listAuditLogs(input: {
  take?: number;
  skip?: number;
  action?: string;
}) {
  const take = Math.min(input.take ?? 50, 100);
  const skip = input.skip ?? 0;
  const where = input.action
    ? { action: { contains: input.action } }
    : {};

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      select: {
        id: true,
        actorUserId: true,
        action: true,
        resourceType: true,
        resourceId: true,
        result: true,
        requestId: true,
        reason: true,
        createdAt: true,
        metadata: true,
        // Never expose raw secrets; ip/ua are already hashed
        ipHash: true,
        userAgentHash: true,
      },
    }),
  ]);

  return { total, take, skip, logs: rows };
}

export async function listLoginAttempts(input: { take?: number }) {
  const take = Math.min(input.take ?? 50, 100);
  return prisma.loginAttempt.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      success: true,
      createdAt: true,
      userId: true,
      identifierHash: true,
      ipHash: true,
      deviceHash: true,
    },
  });
}

export async function listSecurityEvents(input: { take?: number }) {
  const take = Math.min(input.take ?? 50, 100);
  return prisma.securityEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      userId: true,
      eventType: true,
      createdAt: true,
      metadata: true,
    },
  });
}

export { loadTargetUserRoles };
