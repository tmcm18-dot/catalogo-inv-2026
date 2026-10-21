'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { resetAdminAccount } from '@/lib/dulces-maxi/admin-auth';
import { DM_BASE } from '@/lib/dulces-maxi/products';

export default function AdminForgot() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setDone(true);
  };

  return (
    <div className="dm-auth">
      <div className="dm-auth__wrap">
        <div className="dm-auth__intro">
          <div className="dm-auth__icon">
            <Mail />
          </div>
          <h1>Reset password</h1>
          <p>En esta réplica no hay correo de recuperación. Podés restablecer el administrador de este dispositivo.</p>
        </div>
        <div className="dm-auth__card">
          {done ? (
            <p className="dm-auth__notice">
              If an account exists with that email, you&apos;ll receive a password reset link shortly.
            </p>
          ) : (
            <form onSubmit={submit} className="dm-auth__form">
              <label htmlFor="email">Email address</label>
              <div className="dm-auth__field">
                <Mail />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <button type="submit" className="dm-btn dm-btn--primary dm-auth__submit">
                Send reset link
              </button>
            </form>
          )}
          <button
            type="button"
            className="dm-btn dm-btn--outline dm-auth__submit"
            style={{ marginTop: 12 }}
            onClick={() => {
              if (window.confirm('Esto borra el administrador guardado en este navegador. ¿Continuar?')) {
                resetAdminAccount();
                setResetDone(true);
              }
            }}
          >
            Restablecer administrador de este dispositivo
          </button>
          {resetDone && (
            <p className="dm-auth__notice" style={{ marginTop: 12 }}>
              Listo. Volvé al ingreso para crear un administrador nuevo.
            </p>
          )}
        </div>
        <p className="dm-auth__footer">
          <Link href={`${DM_BASE}/admin/iniciar-sesion`}>
            <ArrowLeft size={12} /> Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
