import type { ReactNode } from 'react';
import Link from 'next/link';

export default function CuentaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="authShell">
      <header className="authTop">
        <Link href="/">Catálogo INV 2026</Link>
        <nav>
          <Link href="/cuenta/iniciar-sesion">Iniciar sesión</Link>
          <Link href="/cuenta/crear-cuenta">Crear cuenta</Link>
        </nav>
      </header>
      <main className="authMain">{children}</main>
    </div>
  );
}
