import { NextResponse } from 'next/server';
import { createSecureToken } from '@/lib/security/tokens';
import { AppError } from '@/lib/errors';

export function createRequestId(): string {
  return createSecureToken(16);
}

export function jsonSuccess<T>(data: T, init?: { status?: number; requestId?: string }) {
  const requestId = init?.requestId ?? createRequestId();
  return NextResponse.json(
    { data, meta: { requestId } },
    {
      status: init?.status ?? 200,
      headers: {
        'x-request-id': requestId,
        'Cache-Control': 'private, no-store',
      },
    },
  );
}

export function jsonError(error: unknown, requestId = createRequestId()) {
  if (error instanceof AppError) {
    const headers: Record<string, string> = {
      'x-request-id': requestId,
      'Cache-Control': 'private, no-store',
    };
    if (error instanceof Object && 'retryAfterSeconds' in error) {
      const retry = (error as { retryAfterSeconds?: number }).retryAfterSeconds;
      if (retry) headers['Retry-After'] = String(retry);
    }
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          requestId,
        },
      },
      { status: error.status, headers },
    );
  }

  console.error('[api]', requestId, error);
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocurrió un error inesperado.',
        requestId,
      },
    },
    {
      status: 500,
      headers: {
        'x-request-id': requestId,
        'Cache-Control': 'private, no-store',
      },
    },
  );
}
