'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { postJson } from '@/components/auth/AuthForm';

export default function AdminTwoFactorClient() {
  const router = useRouter();
  const [secret, setSecret] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<string[] | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <section className="authCard">
      <h2>Autenticación en dos pasos</h2>
      <p>La autenticación TOTP es obligatoria para administradores.</p>
      <button
        type="button"
        className="authSubmit"
        disabled={busy}
        onClick={async () => {
          setError(null);
          setBusy(true);
          try {
            const data = await postJson<{ secret: string; qrDataUrl: string }>(
              '/api/auth/2fa/setup',
              {},
            );
            setSecret(data.secret);
            setQr(data.qrDataUrl);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
          } finally {
            setBusy(false);
          }
        }}
      >
        Generar TOTP
      </button>
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="QR TOTP admin" width={180} height={180} />
      ) : null}
      {secret ? <p className="authMono">{secret}</p> : null}
      <label className="authField">
        <span>Código de confirmación</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="one-time-code"
          inputMode="numeric"
        />
      </label>
      <button
        type="button"
        className="authSubmit"
        disabled={busy}
        onClick={async () => {
          setError(null);
          setBusy(true);
          try {
            const data = await postJson<{ recoveryCodes: string[] }>(
              '/api/auth/2fa/confirm',
              { code },
            );
            setRecovery(data.recoveryCodes);
            router.push('/admin');
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error');
          } finally {
            setBusy(false);
          }
        }}
      >
        Confirmar y continuar
      </button>
      {recovery ? (
        <ul>
          {recovery.map((item) => (
            <li key={item} className="authMono">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p className="authError" role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
    </section>
  );
}
