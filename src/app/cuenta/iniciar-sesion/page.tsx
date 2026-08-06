'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthForm, postJson } from '@/components/auth/AuthForm';

export default function CuentaLoginPage() {
  const router = useRouter();

  return (
    <AuthForm
      title="Iniciar sesión"
      subtitle="Accedé con tu correo o teléfono."
      submitLabel="Iniciar sesión"
      fields={[
        {
          name: 'identifier',
          label: 'Correo electrónico o teléfono',
          autoComplete: 'username',
        },
        {
          name: 'password',
          label: 'Contraseña',
          type: 'password',
          autoComplete: 'current-password',
        },
        {
          name: 'rememberMe',
          label: 'Recordarme',
          type: 'checkbox',
          required: false,
        },
      ]}
      footer={
        <>
          <Link href="/cuenta/recuperar-contrasena">Recuperar contraseña</Link>
          <Link href="/cuenta/crear-cuenta">Crear una cuenta</Link>
          <p className="authLegal">
            Al continuar aceptás los términos y la política de privacidad.
          </p>
        </>
      }
      onSubmit={async (values) => {
        await postJson('/api/auth/login', {
          identifier: values.identifier,
          password: values.password,
          rememberMe: Boolean(values.rememberMe),
          adminContext: false,
        });
        router.push('/cuenta/perfil');
        router.refresh();
      }}
    />
  );
}
