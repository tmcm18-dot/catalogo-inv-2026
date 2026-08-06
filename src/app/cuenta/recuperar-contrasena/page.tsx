'use client';

import Link from 'next/link';
import { AuthForm, postJson } from '@/components/auth/AuthForm';

export default function RecuperarPage() {
  return (
    <AuthForm
      title="Recuperar contraseña"
      subtitle="Te enviaremos instrucciones si existe una cuenta asociada."
      submitLabel="Enviar instrucciones"
      fields={[
        {
          name: 'identifier',
          label: 'Correo electrónico o teléfono',
          autoComplete: 'username',
        },
      ]}
      footer={<Link href="/cuenta/iniciar-sesion">Volver al inicio de sesión</Link>}
      onSubmit={async (values) => {
        await postJson('/api/auth/forgot-password', {
          identifier: values.identifier,
        });
      }}
    />
  );
}
