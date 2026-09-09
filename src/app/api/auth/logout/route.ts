import { jsonError, jsonSuccess } from '@/lib/api/response';
import { assertTrustedOrigin } from '@/lib/security/origin';
import {
  clearSessionCookie,
  readSessionToken,
  revokeSessionByToken,
} from '@/modules/auth/services/session-service';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const token = await readSessionToken();
    if (token) {
      await revokeSessionByToken(token, 'LOGOUT');
    }
    await clearSessionCookie();
    return jsonSuccess({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
