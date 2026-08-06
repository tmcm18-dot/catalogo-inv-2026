'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthForm, postJson } from '@/components/auth/AuthForm';

export default function CrearCuentaPage() {
  const router = useRouter();

  return (
    <AuthForm
      title="Crear cuenta"
      subtitle="Registro de cliente. Luego verificá tu correo."
      submitLabel="Crear cuenta"
      fields={[
        { name: 'firstName', label: 'Nombre', autoComplete: 'given-name' },
        { name: 'lastName', label: 'Apellido', autoComplete: 'family-name' },
        { name: 'email', label: 'Correo electrónico', type: 'email', autoComplete: 'email' },
        { name: 'phone', label: 'Teléfono', autoComplete: 'tel' },
        { name: 'password', label: 'Contraseña', type: 'password', autoComplete: 'new-password' },
        {
          name: 'confirmPassword',
          label: 'Confirmar contraseña',
          type: 'password',
          autoComplete: 'new-password',
        },
        { name: 'acceptTerms', label: 'Acepto los términos y condiciones', type: 'checkbox' },
        { name: 'acceptPrivacy', label: 'Acepto la política de privacidad', type: 'checkbox' },
        {
          name: 'marketingConsent',
          label: 'Quiero recibir novedades comerciales (opcional)',
          type: 'checkbox',
          required: false,
        },
      ]}
      footer={<Link href="/cuenta/iniciar-sesion">Ya tengo cuenta</Link>}
      onSubmit={async (values) => {
        if (!values.acceptTerms || !values.acceptPrivacy) {
          throw new Error('Debés aceptar términos y privacidad.');
        }
        await postJson('/api/auth/register', {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          confirmPassword: values.confirmPassword,
          acceptTerms: true,
          acceptPrivacy: true,
          marketingConsent: Boolean(values.marketingConsent),
        });
        router.push('/cuenta/verificar');
      }}
    />
  );
}
