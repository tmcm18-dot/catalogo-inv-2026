'use client';

import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { postJson } from '@/components/auth/AuthForm';
import type { ReauthScope } from '@/modules/authorization/permissions';

type Props = {
  open: boolean;
  scope: ReauthScope;
  title?: string;
  onCancel: () => void;
  /** Receives grant token in memory only; caller must not persist it. */
  onGranted: (grantToken: string) => Promise<void>;
};

export function ReauthModal({
  open,
  scope,
  title = 'Confirmá tu identidad',
  onCancel,
  onGranted,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setPassword('');
      setTotpCode('');
      setError(null);
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      setPassword('');
      setTotpCode('');
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    let grantToken: string | null = null;
    try {
      const data = await postJson<{
        grantToken: string;
        scope: string;
        expiresAt: string;
      }>('/api/admin/reauth/confirm', {
        scope,
        password,
        totpCode: totpCode.trim() || undefined,
      });
      grantToken = data.grantToken;
      await onGranted(grantToken);
      setPassword('');
      setTotpCode('');
      grantToken = null;
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reautenticación fallida.');
      grantToken = null;
    } finally {
      setBusy(false);
      setPassword('');
      // Keep totp cleared after attempt to avoid reuse in UI memory longer than needed.
      setTotpCode('');
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="reauthDialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) {
          setPassword('');
          setTotpCode('');
          onCancel();
        }
      }}
      onClose={() => {
        setPassword('');
        setTotpCode('');
      }}
    >
      <form onSubmit={handleSubmit} className="authForm">
        <h2 id={titleId}>{title}</h2>
        <p className="authSubtitle">
          Acción sensible (<span className="authMono">{scope}</span>). Ingresá tu
          contraseña y el código TOTP. El permiso temporal dura 5 minutos y es de
          un solo uso.
        </p>
        <label className="authField">
          <span>Contraseña actual</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={10}
            disabled={busy}
          />
        </label>
        <label className="authField">
          <span>Código TOTP</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            required
            minLength={6}
            disabled={busy}
          />
        </label>
        {error ? (
          <p className="authError" role="alert" aria-live="polite">
            {error}
          </p>
        ) : null}
        <div className="adminActionsRow">
          <button type="submit" className="authSubmit" disabled={busy}>
            {busy ? 'Verificando…' : 'Confirmar'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setPassword('');
              setTotpCode('');
              onCancel();
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  );
}
