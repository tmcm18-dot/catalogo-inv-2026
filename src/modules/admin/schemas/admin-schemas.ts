import { z } from 'zod';

export const adminReasonSchema = z.object({
  reason: z.string().trim().min(5).max(500),
});

export const adminUserListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z
    .enum([
      'PENDING_VERIFICATION',
      'ACTIVE',
      'TEMPORARILY_BLOCKED',
      'SUSPENDED',
      'DELETED',
    ])
    .optional(),
  role: z.enum(['CUSTOMER', 'SELLER', 'ADMIN', 'SUPERADMIN']).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

export const adminSuspendSchema = adminReasonSchema.extend({
  grantToken: z.string().min(10).optional(),
});

export const adminBlockSchema = adminReasonSchema.extend({
  minutes: z.number().int().min(5).max(1440).optional(),
  grantToken: z.string().min(10).optional(),
});

export const adminRoleChangeSchema = adminReasonSchema.extend({
  roleCode: z.enum(['CUSTOMER', 'SELLER', 'ADMIN', 'SUPERADMIN']),
  expiresAt: z.string().datetime().nullable().optional(),
  grantToken: z.string().min(10),
});

export const adminSessionRevokeSchema = adminReasonSchema.extend({
  grantToken: z.string().min(10).optional(),
});

export const reauthConfirmSchema = z.object({
  scope: z.string().min(3).max(80),
  password: z.string().min(10).max(128),
  totpCode: z.string().min(6).max(12).optional(),
});
