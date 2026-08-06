import { cookies } from 'next/headers';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { getRequestMeta } from '@/lib/http/request-meta';
import {
  getAdminChallengeCookieName,
  sessionCookieOptions,
  ANONYMOUS_COOKIE_NAME,
} from '@/lib/security/cookies';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { loginSchema } from '@/modules/auth/schemas/auth-schemas';
import {
  authenticateUser,
  createAdminChallenge,
} from '@/modules/auth/services/auth-service';
import {
  clearSessionCookie,
  readSessionToken,
  rotateSession,
  setSessionCookie,
} from '@/modules/auth/services/session-service';
import { recordAudit } from '@/modules/audit/services/audit-service';
import { mergeAnonymousCartIntoUserCart } from '@/modules/carts/services/merge-service';
import { checkLoginRisk } from '@/lib/rate-limit/login-risk';
import { normalizeIdentifier } from '@/lib/security/identifiers';
import { hashToken } from '@/lib/security/tokens';
import { verifyCaptchaIfRequired } from '@/lib/captcha/provider';
import { enforceRateLimit } from '@/lib/rate-limit/limiter';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Los datos enviados no son válidos.');
    }

    const adminContext = Boolean(body?.adminContext);
    const meta = getRequestMeta(request);
    const identifier = normalizeIdentifier(parsed.data.identifier);
    const identifierHash = hashToken(identifier.normalized);

    const existingUser = await prisma.user.findFirst({
      where:
        identifier.kind === 'email'
          ? { normalizedEmail: identifier.normalized, deletedAt: null }
          : { normalizedPhone: identifier.normalized, deletedAt: null },
      select: { id: true },
    });

    await enforceRateLimit({
      dimensions: {
        endpoint: adminContext ? 'auth.login.admin' : 'auth.login',
        ipHash: meta.ipHash,
        identifierHash,
        accountId: existingUser?.id,
      },
      limit: 30,
      windowMs: 15 * 60 * 1000,
      blockMs: 15 * 60 * 1000,
    });

    const risk = await checkLoginRisk({
      ipHash: meta.ipHash,
      identifierHash,
      userId: existingUser?.id,
    });

    if (risk.captchaRequired) {
      const captcha = await verifyCaptchaIfRequired({
        required: true,
        token: parsed.data.captchaToken,
        ip: meta.ip,
      });
      if (!captcha?.success) {
        throw new ValidationError(
          'Se requiere verificación CAPTCHA. Completá el desafío e intentá de nuevo.',
        );
      }
    }

    const result = await authenticateUser(parsed.data, {
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
      adminContext,
    });

    if (adminContext && result.requiresTwoFactor && result.hasTotp) {
      const challengeToken = await createAdminChallenge(result.user.id);
      const jar = await cookies();
      jar.set(getAdminChallengeCookieName(), challengeToken, {
        ...sessionCookieOptions,
        maxAge: 10 * 60,
      });
      await clearSessionCookie();
      return jsonSuccess({
        requiresTwoFactor: true,
        message: 'Ingresá el código de autenticación en dos pasos.',
      });
    }

    const oldToken = await readSessionToken();
    const session = await rotateSession({
      oldToken,
      userId: result.user.id,
      rememberMe: parsed.data.rememberMe,
      isAdminContext: adminContext,
      twoFactorOk: adminContext ? false : true,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });
    await setSessionCookie(session.token, session.expiresAt);

    const jar = await cookies();
    const anonymousId = jar.get(ANONYMOUS_COOKIE_NAME)?.value;
    if (anonymousId) {
      await mergeAnonymousCartIntoUserCart({
        anonymousId,
        userId: result.user.id,
      }).catch(() => undefined);
    }

    await recordAudit({
      actorUserId: result.user.id,
      action: adminContext ? 'auth.admin_login' : 'auth.login',
      resourceType: 'session',
    });

    return jsonSuccess({
      requiresTwoFactor: false,
      requiresTwoFactorSetup: Boolean(adminContext && !result.hasTotp),
      captchaRequired: risk.captchaRequired,
      user: {
        id: result.user.id,
        email: result.user.email,
        roles: result.roles,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
