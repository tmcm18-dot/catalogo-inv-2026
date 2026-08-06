import { jsonError, jsonSuccess } from '@/lib/api/response';
import { ValidationError } from '@/lib/errors';
import { assertTrustedOrigin } from '@/lib/security/origin';
import { registerSchema } from '@/modules/auth/schemas/auth-schemas';
import { registerCustomer } from '@/modules/auth/services/auth-service';

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Los datos enviados no son válidos.');
    }

    const result = await registerCustomer(parsed.data);
    return jsonSuccess(
      {
        userId: result.userId,
        message:
          'Si los datos son válidos, recibirás instrucciones para verificar tu cuenta.',
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
