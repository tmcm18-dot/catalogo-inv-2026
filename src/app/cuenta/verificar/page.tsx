'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthForm, postJson } from '@/components/auth/AuthForm';

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [autoError, setAutoError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    postJson('/api/auth/verify-email', { token })
      .then(() => {
        router.push('/cuenta/perfil');
        router.refresh();
      })
      .catch((err: Error) => setAutoError(err.message));
  }, [token, router]);

  return (
    <AuthForm
      title="Verificar cuenta"
      subtitle={
        token
          ? 'Estamos verificando tu enlace…'
          : 'Pegá el token de verificación o usá el enlace del correo.'
      }
      submitLabel="Verificar"
      fields={[{ name: 'token', label: 'Token de verificación' }]}
      extras={autoError ? <p className="authError">{autoError}</p> : null}
      onSubmit={async (values) => {
        await postJson('/api/auth/verify-email', { token: values.token });
        router.push('/cuenta/perfil');
        router.refresh();
      }}
    />
  );
}

export default function VerificarPage() {
  return (
    <Suspense fallback={<p className="authCard">Cargando…</p>}>
      <VerifyInner />
    </Suspense>
  );
}
