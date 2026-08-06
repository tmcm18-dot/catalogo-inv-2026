import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { requireAdminAccess } from '@/modules/authorization/services/authorization-service';
import { adminRequestContext } from '@/modules/admin/lib/admin-request';
import { reauthConfirmSchema } from '@/modules/admin/schemas/admin-schemas';
import {
  createSensitiveActionGrant,
  parseReauthScope,
} from '@/modules/auth/services/reauth-service';
import { hashToken } from '@/lib/security/tokens';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const session = await requireAdminAccess();
    const body = await request.json();
    const parsed = reauthConfirmSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError();
    const ctx = adminRequestContext(request);
    const scope = parseReauthScope(parsed.data.scope);

    const grant = await createSensitiveActionGrant({
      session,
      scope,
      password: parsed.data.password,
      totpCode: parsed.data.totpCode,
      requestId: ctx.requestId,
      ipHash: ctx.ipHash,
      userAgentHash: ctx.userAgent ? hashToken(ctx.userAgent) : undefined,
    });

    return jsonSuccess(
      {
        grantToken: grant.grantToken,
        expiresAt: grant.expiresAt.toISOString(),
        scope: grant.scope,
      },
      { requestId: ctx.requestId },
    );
  } catch (error) {
    return jsonError(error);
  }
}
