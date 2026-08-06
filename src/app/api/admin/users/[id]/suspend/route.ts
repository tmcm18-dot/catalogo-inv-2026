import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { PERMISSIONS } from '@/modules/authorization/permissions';
import { requireAdminPermission } from '@/modules/authorization/services/authorization-service';
import { adminRequestContext } from '@/modules/admin/lib/admin-request';
import { adminSuspendSchema } from '@/modules/admin/schemas/admin-schemas';
import { suspendUser } from '@/modules/admin/services/user-admin-service';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    assertTrustedOrigin(request);
    const actor = await requireAdminPermission(PERMISSIONS.USERS_SUSPEND);
    const { id } = await params;
    const body = await request.json();
    const parsed = adminSuspendSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError();
    const ctx = adminRequestContext(request);

    await suspendUser({
      actor,
      targetUserId: id,
      reason: parsed.data.reason,
      grantToken: parsed.data.grantToken,
      ...ctx,
    });
    return jsonSuccess({ suspended: true }, { requestId: ctx.requestId });
  } catch (error) {
    return jsonError(error);
  }
}
