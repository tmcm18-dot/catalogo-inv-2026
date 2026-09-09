import { cookies } from 'next/headers';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { InvalidOrExpiredTokenError, ValidationError } from '@/lib/errors';
import { getRequestMeta } from '@/lib/http/request-meta';
import {
  getAdminChallengeCookieName,
  sessionCookieOptions,
} from '@/lib/security/cookies';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { twoFactorCodeSchema } from '@/modules/auth/schemas/auth-schemas';
import {
  consumeAdminChallenge,
  deleteAdminChallenge,
} from '@/modules/auth/services/auth-service';
import {
  readSessionToken,
  rotateSession,
  setSessionCookie,
} from '@/modules/auth/services/session-service';
import {
  consumeRecoveryCode,
  verifyUserTotp,
} from '@/modules/auth/services/two-factor-service';
import { recordAudit } from '@/modules/audit/services/audit-service';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const body = await request.json();
    const parsed = twoFactorCodeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Código inválido.');
    }

    const jar = await cookies();
    const challengeToken = jar.get(getAdminChallengeCookieName())?.value;
    if (!challengeToken) {
      throw new InvalidOrExpiredTokenError();
    }

    const challenge = await consumeAdminChallenge(challengeToken);
    const totpOk = await verifyUserTotp(challenge.userId, parsed.data.code);
    const recoveryOk = totpOk
      ? false
      : await consumeRecoveryCode(challenge.userId, parsed.data.code);

    if (!totpOk && !recoveryOk) {
      throw new ValidationError('Código 2FA inválido.');
    }

    await deleteAdminChallenge(challenge.id);
    jar.set(getAdminChallengeCookieName(), '', {
      ...sessionCookieOptions,
      maxAge: 0,
    });

    const meta = getRequestMeta(request);
    const oldToken = await readSessionToken();
    const session = await rotateSession({
      oldToken,
      userId: challenge.userId,
      rememberMe: false,
      isAdminContext: true,
      twoFactorOk: true,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });
    await setSessionCookie(session.token, session.expiresAt);

    await recordAudit({
      actorUserId: challenge.userId,
      action: 'auth.admin_2fa_verified',
      resourceType: 'session',
    });

    return jsonSuccess({ verified: true });
  } catch (error) {
    return jsonError(error);
  }
}
