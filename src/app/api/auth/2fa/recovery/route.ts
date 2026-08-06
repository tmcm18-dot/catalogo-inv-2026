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
import { REAUTH_SCOPES } from '@/modules/authorization/permissions';
import { consumeSensitiveActionGrant } from '@/modules/auth/services/reauth-service';
import { z } from 'zod';
import { AuditResult } from '@prisma/client';
import { adminRequestContext } from '@/modules/admin/lib/admin-request';

const recoveryRegenSchema = twoFactorCodeSchema.extend({
  grantToken: z.string().min(10).optional(),
});

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const session = await requireValidSession();
    const body = await request.json();
    const parsed = recoveryRegenSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Código inválido.');
    }

    const isAdmin =
      session.user.roles.includes('ADMIN') ||
      session.user.roles.includes('SUPERADMIN');

    if (isAdmin) {
      if (!parsed.data.grantToken) {
        throw new ValidationError(
          'Se requiere reautenticación para regenerar códigos de recuperación.',
        );
      }
      await consumeSensitiveActionGrant({
        session,
        grantToken: parsed.data.grantToken,
        expectedScope: REAUTH_SCOPES.TWO_FACTOR_REGENERATE_RECOVERY_CODES,
      });
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

    const ctx = adminRequestContext(request);
    await recordAudit({
      actorUserId: session.userId,
      action: 'security.2fa.recovery_regenerated',
      resourceType: 'user',
      resourceId: session.userId,
      result: AuditResult.SUCCESS,
      requestId: ctx.requestId,
    });

    return jsonSuccess(
      { recoveryCodes: recovery.plain },
      { requestId: ctx.requestId },
    );
  } catch (error) {
    return jsonError(error);
  }
}
