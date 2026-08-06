'use client';

import { useRouter } from 'next/navigation';
import { AuthForm, postJson } from '@/components/auth/AuthForm';

export default function AdminLoginPage() {
  const router = useRouter();

  return (
    <AuthForm
      title="Acceso administrativo"
      subtitle="Inicio de sesión para administradores. 2FA obligatoria."
      submitLabel="Continuar"
      fields={[
        {
          name: 'identifier',
          label: 'Correo electrónico',
          autoComplete: 'username',
        },
        {
          name: 'password',
          label: 'Contraseña',
          type: 'password',
          autoComplete: 'current-password',
        },
      ]}
      onSubmit={async (values) => {
        const data = await postJson<{
          requiresTwoFactor?: boolean;
          requiresTwoFactorSetup?: boolean;
        }>('/api/auth/login', {
          identifier: values.identifier,
          password: values.password,
          rememberMe: false,
          adminContext: true,
        });

        if (data.requiresTwoFactor) {
          router.push('/admin/verificar-2fa');
          return;
        }
        if (data.requiresTwoFactorSetup) {
          router.push('/admin/seguridad');
          return;
        }
        router.push('/admin');
        router.refresh();
      }}
    />
  );
}
