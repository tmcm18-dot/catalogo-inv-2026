'use client';

import { useRouter } from 'next/navigation';
import { AuthForm, postJson } from '@/components/auth/AuthForm';

export default function AdminVerify2faPage() {
  const router = useRouter();

  return (
    <AuthForm
      title="Verificación en dos pasos"
      subtitle="Ingresá el código de tu autenticador o un código de recuperación."
      submitLabel="Verificar"
      fields={[{ name: 'code', label: 'Código 2FA', autoComplete: 'one-time-code' }]}
      onSubmit={async (values) => {
        await postJson('/api/auth/2fa/verify', { code: values.code });
        router.push('/admin');
        router.refresh();
      }}
    />
  );
}
