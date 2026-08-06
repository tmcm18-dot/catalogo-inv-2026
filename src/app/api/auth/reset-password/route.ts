import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { resetPasswordSchema } from '@/modules/auth/schemas/auth-schemas';
import { resetPasswordWithToken } from '@/modules/auth/services/auth-service';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Los datos enviados no son válidos.');
    }

    await resetPasswordWithToken({
      token: parsed.data.token,
      password: parsed.data.password,
    });

    return jsonSuccess({
      message: 'La contraseña fue actualizada. Podés iniciar sesión.',
    });
  } catch (error) {
    return jsonError(error);
  }
}
