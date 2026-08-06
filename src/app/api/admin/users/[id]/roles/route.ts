import { RoleCode } from '@prisma/client';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { PERMISSIONS } from '@/modules/authorization/permissions';
import { requireAdminPermission } from '@/modules/authorization/services/authorization-service';
import { adminRequestContext } from '@/modules/admin/lib/admin-request';
import { adminRoleChangeSchema } from '@/modules/admin/schemas/admin-schemas';
import {
  assignUserRole,
  revokeUserRole,
} from '@/modules/admin/services/user-admin-service';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    assertTrustedOrigin(request);
    const actor = await requireAdminPermission(PERMISSIONS.ROLES_MANAGE);
    const { id } = await params;
    const body = await request.json();
    const parsed = adminRoleChangeSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError();
    const ctx = adminRequestContext(request);

    await assignUserRole({
      actor,
      targetUserId: id,
      roleCode: parsed.data.roleCode as RoleCode,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      reason: parsed.data.reason,
      grantToken: parsed.data.grantToken,
      ...ctx,
    });
    return jsonSuccess({ assigned: true }, { requestId: ctx.requestId });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    assertTrustedOrigin(request);
    const actor = await requireAdminPermission(PERMISSIONS.ROLES_MANAGE);
    const { id } = await params;
    const body = await request.json();
    const parsed = adminRoleChangeSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError();
    const ctx = adminRequestContext(request);

    await revokeUserRole({
      actor,
      targetUserId: id,
      roleCode: parsed.data.roleCode as RoleCode,
      reason: parsed.data.reason,
      grantToken: parsed.data.grantToken,
      ...ctx,
    });
    return jsonSuccess({ revoked: true }, { requestId: ctx.requestId });
  } catch (error) {
    return jsonError(error);
  }
}
