import { jsonError, jsonSuccess } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { requireValidSession } from '@/modules/auth/services/session-service';

export async function GET() {
  try {
    const session = await requireValidSession();
    const sessions = await prisma.session.findMany({
      where: { userId: session.userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastActivityAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        lastActivityAt: true,
        expiresAt: true,
        rememberMe: true,
        isAdminContext: true,
        deviceName: true,
      },
    });

    return jsonSuccess({
      currentSessionId: session.sessionId,
      sessions,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertTrustedOrigin(request);
    const session = await requireValidSession();
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) {
      return jsonError(new Error('sessionId requerido'));
    }

    await prisma.session.updateMany({
      where: { id: sessionId, userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: 'USER_REVOKED' },
    });

    return jsonSuccess({ revoked: true });
  } catch (error) {
    return jsonError(error);
  }
}
