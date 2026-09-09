'use client';

import { useState } from 'react';
import Link from 'next/link';
import { postJson } from '@/components/auth/AuthForm';

export default function CuentaSeguridadPage() {
  const [secret, setSecret] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  return (
    <section className="authCard">
      <h1>Seguridad</h1>
      <p>Activá autenticación en dos pasos (TOTP) de forma opcional para clientes.</p>
      <button
        type="button"
        className="authSubmit"
        onClick={async () => {
          setError(null);
          try {
            const data = await postJson<{
              secret: string;
              qrDataUrl: string;
            }>('/api/auth/2fa/setup', {});
            setSecret(data.secret);
            setQr(data.qrDataUrl);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
          }
        }}
      >
        Generar configuración 2FA
      </button>

      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="Código QR TOTP" width={180} height={180} />
      ) : null}
      {secret ? <p className="authMono">Secret: {secret}</p> : null}

      <label className="authField">
        <span>Código de confirmación</span>
        <input value={code} onChange={(e) => setCode(e.target.value)} />
      </label>
      <button
        type="button"
        className="authSubmit"
        onClick={async () => {
          setError(null);
          try {
            const data = await postJson<{ recoveryCodes: string[] }>(
              '/api/auth/2fa/confirm',
              { code },
            );
            setRecovery(data.recoveryCodes);
            setOk('2FA activada.');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
          }
        }}
      >
        Confirmar 2FA
      </button>

      {recovery ? (
        <div>
          <p>Guardá estos códigos de recuperación:</p>
          <ul>
            {recovery.map((item) => (
              <li key={item} className="authMono">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {error ? <p className="authError">{error}</p> : null}
      {ok ? <p className="authOk">{ok}</p> : null}
      <div className="authFooter">
        <Link href="/cuenta/perfil">Volver al perfil</Link>
      </div>
    </section>
  );
}
