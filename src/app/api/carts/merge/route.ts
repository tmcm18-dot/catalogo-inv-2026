import { cookies } from 'next/headers';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ANONYMOUS_COOKIE_NAME } from '@/lib/security/cookies';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { requireValidSession } from '@/modules/auth/services/session-service';
import { mergeAnonymousCartIntoUserCart } from '@/modules/carts/services/merge-service';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const session = await requireValidSession();
    const jar = await cookies();
    const anonymousId = jar.get(ANONYMOUS_COOKIE_NAME)?.value;

    if (!anonymousId) {
      return jsonSuccess({
        merged: false,
        note: 'No anonymous cart cookie. Client localStorage remains authoritative in Phase 1.',
      });
    }

    const result = await mergeAnonymousCartIntoUserCart({
      anonymousId,
      userId: session.userId,
    });

    return jsonSuccess({
      ...result,
      note: 'Server cart merge stub. Visitor carts still use localStorage until Phase 2.',
    });
  } catch (error) {
    return jsonError(error);
  }
}
