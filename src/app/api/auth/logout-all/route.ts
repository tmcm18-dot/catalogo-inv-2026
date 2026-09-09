import { jsonError, jsonSuccess } from '@/lib/api/response';
import { assertTrustedOrigin } from '@/lib/security/origin';
import {
  clearSessionCookie,
  requireValidSession,
  revokeAllUserSessions,
} from '@/modules/auth/services/session-service';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const session = await requireValidSession();
    await revokeAllUserSessions(session.userId, 'LOGOUT_ALL');
    await clearSessionCookie();
    return jsonSuccess({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
