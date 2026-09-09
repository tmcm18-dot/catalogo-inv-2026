import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { getRequestMeta } from '@/lib/http/request-meta';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { verifyEmailSchema } from '@/modules/auth/schemas/auth-schemas';
import { verifyEmailToken } from '@/modules/auth/services/auth-service';
import {
  readSessionToken,
  rotateSession,
  setSessionCookie,
} from '@/modules/auth/services/session-service';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const body = await request.json();
    const parsed = verifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Los datos enviados no son válidos.');
    }

    const result = await verifyEmailToken(parsed.data.token);
    const meta = getRequestMeta(request);
    const oldToken = await readSessionToken();
    const session = await rotateSession({
      oldToken,
      userId: result.userId,
      rememberMe: false,
      isAdminContext: false,
      twoFactorOk: true,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });
    await setSessionCookie(session.token, session.expiresAt);

    return jsonSuccess({ verified: true });
  } catch (error) {
    return jsonError(error);
  }
}
