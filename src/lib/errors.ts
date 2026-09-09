export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(
      'INVALID_CREDENTIALS',
      'No fue posible iniciar sesión con los datos proporcionados.',
      401,
    );
  }
}

export class ForbiddenError extends AppError {
  constructor(code = 'FORBIDDEN', message = 'No tenés permisos para realizar esta operación.') {
    super(code, message, 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Debés iniciar sesión para continuar.') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Los datos enviados no son válidos.') {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class InvalidOrExpiredTokenError extends AppError {
  constructor() {
    super('INVALID_OR_EXPIRED_TOKEN', 'El enlace o código ya no es válido.', 400);
  }
}

export class RateLimitedError extends AppError {
  readonly retryAfterSeconds?: number;

  constructor(retryAfterSeconds?: number) {
    super(
      'RATE_LIMITED',
      'Demasiados intentos. Intentá nuevamente más tarde.',
      429,
    );
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'No fue posible completar la operación.') {
    super('CONFLICT', message, 409);
  }
}
