'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthForm, postJson } from '@/components/auth/AuthForm';

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';

  return (
    <AuthForm
      title="Restablecer contraseña"
      subtitle="Elegí una contraseña nueva (mínimo 10 caracteres)."
      submitLabel="Actualizar contraseña"
      fields={[
        { name: 'token', label: 'Token', autoComplete: 'off' },
        { name: 'password', label: 'Nueva contraseña', type: 'password', autoComplete: 'new-password' },
        {
          name: 'confirmPassword',
          label: 'Confirmar contraseña',
          type: 'password',
          autoComplete: 'new-password',
        },
      ]}
      extras={
        token ? (
          <input type="hidden" name="token" defaultValue={token} />
        ) : null
      }
      footer={<Link href="/cuenta/iniciar-sesion">Ir a iniciar sesión</Link>}
      onSubmit={async (values) => {
        await postJson('/api/auth/reset-password', {
          token: values.token || token,
          password: values.password,
          confirmPassword: values.confirmPassword,
        });
        router.push('/cuenta/iniciar-sesion');
      }}
    />
  );
}

export default function RestablecerPage() {
  return (
    <Suspense fallback={<p className="authCard">Cargando…</p>}>
      <ResetInner />
    </Suspense>
  );
}
