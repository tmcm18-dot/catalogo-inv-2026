import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { getRequestMeta } from '@/lib/http/request-meta';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { twoFactorSetupConfirmSchema } from '@/modules/auth/schemas/auth-schemas';
import {
  readSessionToken,
  requireValidSession,
  rotateSession,
  setSessionCookie,
} from '@/modules/auth/services/session-service';
import { confirmTotpSetup } from '@/modules/auth/services/two-factor-service';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const session = await requireValidSession();
    const body = await request.json();
    const parsed = twoFactorSetupConfirmSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Código inválido.');
    }

    const result = await confirmTotpSetup(session, parsed.data.code);

    if (session.isAdminContext) {
      const meta = getRequestMeta(request);
      const oldToken = await readSessionToken();
      const rotated = await rotateSession({
        oldToken,
        userId: session.userId,
        rememberMe: false,
        isAdminContext: true,
        twoFactorOk: true,
        userAgent: meta.userAgent,
        ip: meta.ip,
      });
      await setSessionCookie(rotated.token, rotated.expiresAt);
    }

    return jsonSuccess({
      enabled: true,
      recoveryCodes: result.recoveryCodes,
    });
  } catch (error) {
    return jsonError(error);
  }
}
