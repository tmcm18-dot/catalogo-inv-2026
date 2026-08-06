import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * Shell visual del área admin.
 * La autorización autoritativa vive en cada página Server Component y en las APIs
 * (`requireAdminAccess` / `requireAdminSession`). El middleware solo comprueba
 * presencia de cookie.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="adminShell">
      <header className="adminTop">
        <strong>Admin INV 2026</strong>
        <nav>
          <Link href="/admin">Resumen</Link>
          <Link href="/admin/seguridad">Seguridad</Link>
          <Link href="/">Catálogo</Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
