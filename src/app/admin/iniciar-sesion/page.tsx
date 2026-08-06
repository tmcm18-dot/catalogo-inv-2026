'use client';

import { useRouter } from 'next/navigation';
import { AdaptiveCaptcha } from '@/components/auth/AdaptiveCaptcha';
import { AuthForm, postJson } from '@/components/auth/AuthForm';
import { useCallback, useEffect, useState } from 'react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [provider, setProvider] = useState<string>('mock');
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  const onTokenChange = useCallback((token: string | null) => {
    setCaptchaToken(token);
  }, []);

  useEffect(() => {
    if (!captchaRequired) setCaptchaToken(null);
  }, [captchaRequired]);

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
      extras={
        <AdaptiveCaptcha
          required={captchaRequired}
          provider={provider}
          siteKey={siteKey}
          resetSignal={resetSignal}
          onTokenChange={onTokenChange}
        />
      }
      onSubmit={async (values) => {
        const identifier = String(values.identifier);

        const risk = await postJson<{
          captchaRequired: boolean;
          provider: string;
          siteKey: string | null;
        }>('/api/auth/login-risk', { identifier });

        setCaptchaRequired(risk.captchaRequired);
        setProvider(risk.provider);
        setSiteKey(risk.siteKey);

        if (risk.captchaRequired && !captchaToken?.trim()) {
          throw new Error(
            'Se requiere verificación CAPTCHA. Completá el desafío e intentá de nuevo.',
          );
        }

        try {
          const data = await postJson<{
            requiresTwoFactor?: boolean;
            requiresTwoFactorSetup?: boolean;
          }>('/api/auth/login', {
            identifier,
            password: values.password,
            rememberMe: false,
            adminContext: true,
            captchaToken: captchaToken || undefined,
          });

          if (data.requiresTwoFactor) {
            router.push('/admin/verificar-2fa');
            return;
          }
          if (data.requiresTwoFactorSetup) {
            router.push('/admin/seguridad/2fa');
            return;
          }
          router.push('/admin');
          router.refresh();
        } catch (err) {
          setCaptchaToken(null);
          setResetSignal((n) => n + 1);
          throw err;
        }
      }}
    />
  );
}
