import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getRequestMeta } from '@/lib/http/request-meta';
import { normalizeIdentifier } from '@/lib/security/identifiers';
import { hashToken } from '@/lib/security/tokens';
import { checkLoginRisk } from '@/lib/rate-limit/login-risk';
import { getCaptchaProvider } from '@/lib/captcha/provider';
import { prisma } from '@/lib/db/prisma';
import { ValidationError } from '@/lib/errors';

/**
 * Lightweight risk probe for adaptive CAPTCHA.
 * Does not reveal whether the account exists.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const identifierRaw =
      typeof body?.identifier === 'string' ? body.identifier.trim() : '';
    if (identifierRaw.length < 3) {
      throw new ValidationError();
    }

    const meta = getRequestMeta(request);
    const identifier = normalizeIdentifier(identifierRaw);
    const identifierHash = hashToken(identifier.normalized);
    const existingUser = await prisma.user.findFirst({
      where:
        identifier.kind === 'email'
          ? { normalizedEmail: identifier.normalized, deletedAt: null }
          : { normalizedPhone: identifier.normalized, deletedAt: null },
      select: { id: true },
    });

    const risk = await checkLoginRisk({
      ipHash: meta.ipHash,
      identifierHash,
      userId: existingUser?.id,
    });

    const provider = getCaptchaProvider();

    return jsonSuccess({
      captchaRequired: risk.captchaRequired,
      provider: provider.name,
      siteKey: risk.captchaRequired ? provider.getSiteKey() : null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
