'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ADMIN_AUTH_EVENT, readSession } from '@/lib/dulces-maxi/admin-auth';
import { DM_BASE } from '@/lib/dulces-maxi/products';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const sync = () => {
      const session = readSession();
      setOk(Boolean(session));
      setReady(true);
      if (!session) {
        const next = encodeURIComponent(pathname || `${DM_BASE}/admin`);
        router.replace(`${DM_BASE}/admin/iniciar-sesion?next=${next}`);
      }
    };
    sync();
    window.addEventListener(ADMIN_AUTH_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(ADMIN_AUTH_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="dm-admin-boot">
        <div className="dm-admin-spinner" aria-label="Cargando" />
      </div>
    );
  }
  if (!ok) return null;
  return <>{children}</>;
}
