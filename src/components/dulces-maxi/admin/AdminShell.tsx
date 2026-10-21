'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Calculator,
  CakeSlice,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Users,
  Warehouse,
} from 'lucide-react';
import { clearSession, readSession } from '@/lib/dulces-maxi/admin-auth';
import { ADMIN_DATA_EVENT, loadAdminBundle } from '@/lib/dulces-maxi/admin-data';
import { CATALOG_EVENT, listCatalogAll } from '@/lib/dulces-maxi/catalog';
import { DM_BASE } from '@/lib/dulces-maxi/products';
import AdminGuard from './AdminGuard';

const MODULES = [
  { key: 'dashboard', href: `${DM_BASE}/admin`, label: 'Dashboard', icon: LayoutDashboard },
  { key: 'productos', href: `${DM_BASE}/admin/productos`, label: 'Productos', icon: Package },
  { key: 'precios', href: `${DM_BASE}/admin/precios`, label: 'Costos y márgenes', icon: Calculator },
  { key: 'inventario', href: `${DM_BASE}/admin/inventario`, label: 'Inventario', icon: Warehouse },
  { key: 'pedidos', href: `${DM_BASE}/admin/pedidos`, label: 'Pedidos', icon: ShoppingBag },
  { key: 'carritos', href: `${DM_BASE}/admin/carritos`, label: 'Carritos', icon: ShoppingCart },
  { key: 'clientes', href: `${DM_BASE}/admin/clientes`, label: 'Clientes', icon: Users },
  { key: 'pasteleria', href: `${DM_BASE}/admin/pasteleria`, label: 'Pastelería', icon: CakeSlice },
  { key: 'creativo', href: `${DM_BASE}/admin/creativo`, label: 'Estudio creativo', icon: Sparkles },
] as const;

export type AdminData = ReturnType<typeof loadAdminBundle> & {
  products: ReturnType<typeof listCatalogAll>;
  refresh: () => void;
};

export function useAdminData(): AdminData {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);
  useEffect(() => {
    const sync = () => refresh();
    window.addEventListener(ADMIN_DATA_EVENT, sync);
    window.addEventListener(CATALOG_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(ADMIN_DATA_EVENT, sync);
      window.removeEventListener(CATALOG_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [refresh]);
  return useMemo(() => {
    void tick;
    return { ...loadAdminBundle(), products: listCatalogAll(), refresh };
  }, [tick, refresh]);
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState('Administrador');
  const [spinning, setSpinning] = useState(false);
  const section =
    MODULES.find((item) => (item.key === 'dashboard' ? pathname === item.href : pathname.startsWith(item.href)))
      ?.key || 'dashboard';

  useEffect(() => {
    setEmail(readSession()?.email || 'Administrador');
  }, []);

  const logout = () => {
    clearSession();
    router.replace(`${DM_BASE}/admin/iniciar-sesion`);
  };

  const reload = () => {
    setSpinning(true);
    window.dispatchEvent(new Event(ADMIN_DATA_EVENT));
    window.dispatchEvent(new Event(CATALOG_EVENT));
    window.setTimeout(() => setSpinning(false), 400);
  };

  return (
    <AdminGuard>
      <div className="dm-admin">
        <header className="dm-admin__top">
          <div className="dm-admin__top-inner">
            <Link href={DM_BASE} className="dm-admin__back" aria-label="Volver a la tienda">
              <ArrowLeft size={20} />
            </Link>
            <div className="dm-admin__brand">
              <p>Dulces Maxi</p>
              <p>Centro de administración</p>
            </div>
            <div className="dm-admin__top-actions">
              <button type="button" onClick={reload} className="dm-admin__iconbtn" aria-label="Actualizar datos">
                <RefreshCw size={20} className={spinning ? 'is-spin' : undefined} />
              </button>
              <button type="button" onClick={logout} className="dm-admin__logout">
                <LogOut size={16} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </header>
        <div className="dm-admin__grid">
          <aside className="dm-admin__aside">
            <div className="dm-admin__mobile-nav">
              <span className="dm-sr-only">Sección del panel</span>
              <select
                value={section}
                onChange={(event) => {
                  const target = MODULES.find((item) => item.key === event.target.value);
                  if (target) router.push(target.href);
                }}
              >
                {MODULES.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="dm-admin__modules-label">Módulos</p>
            <nav className="dm-admin__nav" aria-label="Módulos administrativos">
              {MODULES.map((item) => {
                const Icon = item.icon;
                const active = section === item.key;
                return (
                  <Link key={item.key} href={item.href} className={active ? 'is-active' : undefined}>
                    <Icon size={20} /> {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="dm-admin__session">
              <strong>Sesión protegida</strong>
              <br />
              {email}
            </div>
          </aside>
          <div className="dm-admin__main">{children}</div>
        </div>
      </div>
    </AdminGuard>
  );
}
