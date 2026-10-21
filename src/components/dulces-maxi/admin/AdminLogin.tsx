'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { LayoutDashboard, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import {
  createAdminAccount,
  hasAdminAccount,
  readSession,
  safeAdminNext,
  verifyAdmin,
  writeSession,
} from '@/lib/dulces-maxi/admin-auth';
import { DM_BASE } from '@/lib/dulces-maxi/products';

function GoogleMark() {
  return (
    <svg className="dm-auth__google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeAdminNext(searchParams.get('next'), DM_BASE);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [firstRun, setFirstRun] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (readSession()) {
      router.replace(next);
      return;
    }
    setFirstRun(!hasAdminAccount());
    setReady(true);
  }, [next, router]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (firstRun) {
        await createAdminAccount(email, password);
        writeSession(email);
        router.replace(next);
        return;
      }
      const ok = await verifyAdmin(email, password);
      if (!ok) throw new Error('Email o contraseña incorrectos');
      writeSession(email);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email o contraseña incorrectos');
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <div className="dm-admin-boot">
        <div className="dm-admin-spinner" />
      </div>
    );
  }

  return (
    <div className="dm-auth">
      <div className="dm-auth__wrap">
        <div className="dm-auth__intro">
          <div className="dm-auth__icon">
            <LayoutDashboard />
          </div>
          <h1>Ingresar a administración</h1>
          <p>Acceso exclusivo para gestionar Dulces Maxi</p>
        </div>
        <div className="dm-auth__card">
          {firstRun && (
            <p className="dm-auth__notice">
              Primera vez en esta réplica: este formulario crea el administrador. El acceso queda
              guardado en este dispositivo (no usa la cuenta de base44).
            </p>
          )}
          <button
            type="button"
            className="dm-auth__google"
            onClick={() =>
              setError('El ingreso con Google no está disponible en esta réplica. Usá email y contraseña.')
            }
          >
            <GoogleMark /> Continuar con Google
          </button>
          <div className="dm-auth__or">
            <span>o</span>
          </div>
          {error && <div className="dm-auth__error">{error}</div>}
          <form onSubmit={submit} className="dm-auth__form">
            <label htmlFor="email">Email</label>
            <div className="dm-auth__field">
              <Mail />
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="dm-auth__row">
              <label htmlFor="password">Contraseña</label>
              <Link href={`${DM_BASE}/admin/olvide-contrasena`}>¿Olvidaste tu contraseña?</Link>
            </div>
            <div className="dm-auth__field">
              <LockKeyhole />
              <input
                id="password"
                type="password"
                autoComplete={firstRun ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="dm-btn dm-btn--primary dm-auth__submit" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle className="is-spin" size={16} /> {firstRun ? 'Creando…' : 'Ingresando...'}
                </>
              ) : firstRun ? (
                'Crear administrador e ingresar'
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>
        <p className="dm-auth__footer">
          <Link href={DM_BASE}>Volver a la tienda</Link>
        </p>
      </div>
    </div>
  );
}
