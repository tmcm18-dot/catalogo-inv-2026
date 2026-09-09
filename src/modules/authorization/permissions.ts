/** Permission codes used by RBAC (seed + runtime guards). */
export const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_MANAGE: 'users.manage',
  USERS_SUSPEND: 'users.suspend',
  SESSIONS_READ: 'sessions.read',
  SESSIONS_REVOKE: 'sessions.revoke',
  ROLES_READ: 'roles.read',
  ROLES_MANAGE: 'roles.manage',
  PERMISSIONS_READ: 'permissions.read',
  AUDIT_READ: 'audit.read',
  SECURITY_MANAGE: 'security.manage',
  SECURITY_VIEW_SENSITIVE: 'security.view_sensitive',
  SYSTEM_CONFIGURE: 'system.configure',
  AI_APPROVE_ACTIONS: 'ai.approve_actions',
  ANALYTICS_READ_BASIC: 'analytics.read_basic',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** API-facing reauth scopes (dotted). Mapped to Prisma SensitiveActionScope. */
export const REAUTH_SCOPES = {
  ROLES_MANAGE: 'roles.manage',
  USERS_SUSPEND_ADMIN: 'users.suspend_admin',
  SESSIONS_REVOKE_ADMIN: 'sessions.revoke_admin',
  TWO_FACTOR_DISABLE: 'two_factor.disable',
  TWO_FACTOR_REGENERATE_RECOVERY_CODES: 'two_factor.regenerate_recovery_codes',
  DATA_EXPORT_SENSITIVE: 'data.export_sensitive',
  SYSTEM_CONFIGURE: 'system.configure',
} as const;

export type ReauthScope = (typeof REAUTH_SCOPES)[keyof typeof REAUTH_SCOPES];

export const REAUTH_TTL_SECONDS = 5 * 60;

/** Throttle DB writes for lastActivityAt (seconds). */
export const SESSION_ACTIVITY_TOUCH_SECONDS = 60;
