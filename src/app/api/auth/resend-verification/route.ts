import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/db/prisma';
import { normalizeIdentifier } from '@/lib/security/identifiers';
import { createSecureToken, hashToken } from '@/lib/security/tokens';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { z } from 'zod';
import { sendVerificationEmail } from '@/modules/auth/services/email-service';

const schema = z.object({
  identifier: z.string().trim().min(3).max(254),
});

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Los datos enviados no son válidos.');
    }

    const normalized = normalizeIdentifier(parsed.data.identifier);
    const user = await prisma.user.findFirst({
      where:
        normalized.kind === 'email'
          ? { normalizedEmail: normalized.normalized, deletedAt: null }
          : { normalizedPhone: normalized.normalized, deletedAt: null },
    });

    if (user && user.status === 'PENDING_VERIFICATION' && user.email) {
      await prisma.emailVerificationToken.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      const token = createSecureToken(32);
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      await sendVerificationEmail({ to: user.email, token });
    }

    return jsonSuccess({
      message:
        'Si existe una cuenta pendiente, enviamos un nuevo enlace de verificación.',
    });
  } catch (error) {
    return jsonError(error);
  }
}
