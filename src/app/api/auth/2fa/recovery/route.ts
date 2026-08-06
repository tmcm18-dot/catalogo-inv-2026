import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { twoFactorCodeSchema } from '@/modules/auth/schemas/auth-schemas';
import { requireValidSession } from '@/modules/auth/services/session-service';
import {
  createRecoveryCodes,
  verifyUserTotp,
} from '@/modules/auth/services/two-factor-service';
import { prisma } from '@/lib/db/prisma';
import { recordAudit } from '@/modules/audit/services/audit-service';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const session = await requireValidSession();
    const body = await request.json();
    const parsed = twoFactorCodeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Código inválido.');
    }

    const ok = await verifyUserTotp(session.userId, parsed.data.code);
    if (!ok) throw new ValidationError('Código 2FA inválido.');

    const recovery = createRecoveryCodes(10);
    await prisma.recoveryCode.deleteMany({ where: { userId: session.userId } });
    await prisma.recoveryCode.createMany({
      data: recovery.hashes.map((codeHash) => ({
        userId: session.userId,
        codeHash,
      })),
    });

    await recordAudit({
      actorUserId: session.userId,
      action: 'security.2fa.recovery_regenerated',
      resourceType: 'user',
      resourceId: session.userId,
    });

    return jsonSuccess({ recoveryCodes: recovery.plain });
  } catch (error) {
    return jsonError(error);
  }
}
