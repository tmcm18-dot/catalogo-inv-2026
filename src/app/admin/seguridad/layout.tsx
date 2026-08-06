import type { ReactNode } from 'react';
import { getOptionalSession } from '@/modules/auth/services/session-service';
import { AdminSecurityNav } from './AdminSecurityNav';

export default async function AdminSeguridadLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getOptionalSession();
  const twoFactorOk = Boolean(session?.twoFactorOk);

  return (
    <section className="adminView adminSecurity">
      <header className="adminSecurityHeader">
        <h1>Seguridad administrativa</h1>
        <AdminSecurityNav twoFactorOk={twoFactorOk} />
      </header>
      {children}
    </section>
  );
}
