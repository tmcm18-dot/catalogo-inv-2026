import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { PERMISSIONS } from '@/modules/authorization/permissions';
import { requireAdminPermission } from '@/modules/authorization/services/authorization-service';
import { adminRequestContext } from '@/modules/admin/lib/admin-request';
import { adminSessionRevokeSchema } from '@/modules/admin/schemas/admin-schemas';
import { revokeAllSessionsAsAdmin } from '@/modules/admin/services/session-admin-service';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    assertTrustedOrigin(request);
    const actor = await requireAdminPermission(PERMISSIONS.SESSIONS_REVOKE);
    const { id } = await params;
    const body = await request.json();
    const parsed = adminSessionRevokeSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError();
    const ctx = adminRequestContext(request);

    const result = await revokeAllSessionsAsAdmin({
      actor,
      targetUserId: id,
      reason: parsed.data.reason,
      grantToken: parsed.data.grantToken,
      ...ctx,
    });
    return jsonSuccess(result, { requestId: ctx.requestId });
  } catch (error) {
    return jsonError(error);
  }
}
