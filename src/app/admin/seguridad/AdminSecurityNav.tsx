'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin/seguridad', label: 'Resumen' },
  { href: '/admin/seguridad/2fa', label: '2FA' },
  { href: '/admin/seguridad/usuarios', label: 'Usuarios' },
  { href: '/admin/seguridad/sesiones', label: 'Sesiones' },
  { href: '/admin/seguridad/auditoria', label: 'Auditoría' },
  { href: '/admin/seguridad/riesgo', label: 'Riesgo' },
];

export function AdminSecurityNav({ twoFactorOk }: { twoFactorOk: boolean }) {
  const pathname = usePathname();
  const visible = twoFactorOk
    ? LINKS
    : LINKS.filter(
        (l) => l.href === '/admin/seguridad' || l.href === '/admin/seguridad/2fa',
      );

  return (
    <nav className="adminSecurityNav" aria-label="Seguridad administrativa">
      {visible.map((link) => {
        const active =
          link.href === '/admin/seguridad'
            ? pathname === link.href
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? 'adminNavActive' : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
