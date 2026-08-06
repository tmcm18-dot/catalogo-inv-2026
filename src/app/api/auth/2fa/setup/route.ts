import QRCode from 'qrcode';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ForbiddenError } from '@/lib/errors';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { requireValidSession } from '@/modules/auth/services/session-service';
import { beginTotpSetup } from '@/modules/auth/services/two-factor-service';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const session = await requireValidSession();
    const isAdmin =
      session.user.roles.includes('ADMIN') ||
      session.user.roles.includes('SUPERADMIN');

    if (session.isAdminContext && !session.twoFactorOk && !isAdmin) {
      throw new ForbiddenError();
    }

    const setup = await beginTotpSetup(session);
    const qrDataUrl = await QRCode.toDataURL(setup.otpauthUrl);

    return jsonSuccess({
      otpauthUrl: setup.otpauthUrl,
      secret: setup.secret,
      qrDataUrl,
    });
  } catch (error) {
    return jsonError(error);
  }
}
