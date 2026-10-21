'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { clearSession, readSession } from '@/lib/dulces-maxi/admin-auth';
import { DM_BASE } from '@/lib/dulces-maxi/products';
import { useEffect, useState } from 'react';

export default function AdminDenied() {
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => setHasSession(Boolean(readSession())), []);
  return (
    <main className="dm-denied">
      <section className="dm-denied__card">
        <div className="dm-denied__icon">
          <ShieldAlert />
        </div>
        <p>Acceso restringido</p>
        <h1>No tenés permisos para administrar esta tienda.</h1>
        <p className="dm-denied__copy">Podés seguir recorriendo el catálogo de Dulces Maxi con normalidad.</p>
        <div className="dm-denied__actions">
          <Link href={DM_BASE} className="dm-btn dm-btn--primary">
            Volver a la tienda
          </Link>
          {hasSession && (
            <button
              type="button"
              className="dm-btn dm-btn--outline"
              onClick={() => {
                clearSession();
                window.location.href = DM_BASE;
              }}
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
