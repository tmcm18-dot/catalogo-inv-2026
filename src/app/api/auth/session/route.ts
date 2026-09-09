import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getOptionalSession } from '@/modules/auth/services/session-service';

export async function GET() {
  try {
    const session = await getOptionalSession();
    if (!session) {
      return jsonSuccess({ authenticated: false, user: null });
    }

    return jsonSuccess({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        phone: session.user.phone,
        roles: session.user.roles,
        permissions: session.user.permissions,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
      },
      isAdminContext: session.isAdminContext,
      twoFactorOk: session.twoFactorOk,
    });
  } catch (error) {
    return jsonError(error);
  }
}
