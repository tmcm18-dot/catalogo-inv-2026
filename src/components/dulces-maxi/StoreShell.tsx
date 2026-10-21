'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import {
  CakeSlice,
  Cookie,
  House,
  MapPin,
  MessageCircle,
  Search,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '@/lib/dulces-maxi/cart';
import { DM_BASE, WHATSAPP_DISPLAY, WHATSAPP_URL } from '@/lib/dulces-maxi/products';

const CONSENT_KEY = 'dulces_maxi_consent';

function SearchForm({
  id,
  className,
  placeholder,
}: {
  id: string;
  className: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `${DM_BASE}/?q=${encodeURIComponent(q)}#productos` : `${DM_BASE}/#productos`);
  };
  return (
    <form onSubmit={submit} className={className} role="search">
      <label htmlFor={id} className="dm-sr-only">
        Buscar productos
      </label>
      <input
        id={id}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
      />
      <Search aria-hidden="true" />
    </form>
  );
}

function Header() {
  const { count } = useCart();
  return (
    <header className="dm-header">
      <div className="dm-header__row">
        <Link href={DM_BASE} className="dm-brand" aria-label="Dulces Maxi, ir al inicio">
          <div className="dm-brand__name">Dulces Maxi</div>
          <div className="dm-brand__tag">Fiesta artesanal de sabores</div>
        </Link>
        <SearchForm id="site-search" className="dm-search" placeholder="Buscar sabor o producto…" />
        <nav className="dm-nav" aria-label="Navegación principal">
          <Link href={`${DM_BASE}/?categoria=mermelada#productos`} className="dm-nav__link">
            Mermeladas
          </Link>
          <Link href={`${DM_BASE}/pasteleria`} className="dm-nav__link">
            <CakeSlice size={16} /> Pastelería
          </Link>
          <Link
            href={`${DM_BASE}/cart`}
            className="dm-nav__cart"
            aria-label={`Carrito con ${count} productos`}
          >
            <ShoppingBag size={20} />
            <span>Carrito</span>
            {count > 0 && <em className="dm-badge">{count}</em>}
          </Link>
        </nav>
      </div>
      <SearchForm id="mobile-search" className="dm-search-mobile" placeholder="Buscar productos…" />
      <nav className="dm-quicklinks" aria-label="Accesos rápidos">
        <Link href={`${DM_BASE}/?categoria=mermelada#productos`} className="dm-chip">
          Mermeladas
        </Link>
        <Link href={`${DM_BASE}/pasteleria`} className="dm-chip dm-chip--primary">
          <CakeSlice size={16} /> Pastelería por encargo
        </Link>
      </nav>
    </header>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();
  const items = [
    { to: DM_BASE, icon: House, label: 'Inicio', exact: true },
    { to: `${DM_BASE}/pasteleria`, icon: CakeSlice, label: 'Pastelería' },
    { to: `${DM_BASE}/cart`, icon: ShoppingBag, label: 'Carrito', badge: count },
  ];
  const isActive = (item: { to: string; exact?: boolean }) =>
    item.exact ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to);
  return (
    <nav className="dm-bottomnav" aria-label="Navegación inferior">
      {items.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            href={item.to}
            className={active ? 'is-active' : undefined}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon />
            <span>{item.label}</span>
            {item.badge ? <em className="dm-badge">{item.badge}</em> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="dm-footer">
      <div className="dm-footer__grid">
        <div>
          <p className="dm-footer__brand">Dulces Maxi</p>
          <p className="dm-footer__copy">
            Mermeladas, dulces y pastelería artesanal pensados para disfrutar y compartir.
          </p>
          <Link href={`${DM_BASE}/pasteleria`} className="dm-footer__link">
            <CakeSlice size={16} /> Pastelería por encargo
          </Link>
        </div>
        <div>
          <p className="dm-footer__title">Entrega</p>
          <p className="dm-footer__line">
            <MapPin size={16} /> Salta, Argentina
          </p>
          <p className="dm-footer__line">Retiro o envío a coordinar.</p>
        </div>
        <div className="dm-footer__right">
          <p className="dm-footer__title">Atención</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="dm-footer__wa">
            <MessageCircle size={16} /> WhatsApp {WHATSAPP_DISPLAY}
          </a>
        </div>
      </div>
      <div className="dm-footer__bottom">
        © {new Date().getFullYear()} Dulces Maxi · Pastelería solo por encargo · Textos legales
        pendientes de revisión.
      </div>
    </footer>
  );
}

function ConsentBanner() {
  const [decided, setDecided] = useState(true);
  useEffect(() => {
    setDecided(window.localStorage.getItem(CONSENT_KEY) !== null);
  }, []);
  if (decided) return null;
  const decide = (analytics: boolean) => {
    window.localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ analytics, decided_at: new Date().toISOString() }),
    );
    setDecided(true);
  };
  return (
    <section className="dm-consent" aria-label="Preferencias de privacidad">
      <div className="dm-consent__body">
        <div className="dm-consent__icon">
          <Cookie size={20} />
        </div>
        <div>
          <h2>Tu privacidad importa</h2>
          <p>
            Usamos almacenamiento necesario para el carrito. La analítica anónima es opcional y nos
            ayuda a mejorar la tienda.
          </p>
        </div>
      </div>
      <div className="dm-consent__actions">
        <button type="button" onClick={() => decide(true)} className="dm-consent__accept">
          Aceptar analítica
        </button>
        <button type="button" onClick={() => decide(false)} className="dm-consent__decline">
          Solo necesarias
        </button>
      </div>
    </section>
  );
}

export default function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="dm-topbar">Pedidos en Salta · Pastelería solo por encargo</div>
      <Header />
      <main>{children}</main>
      <BottomNav />
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className="dm-fab"
        aria-label="Consultar por WhatsApp"
      >
        <MessageCircle size={24} />
      </a>
      <Footer />
      <div className="dm-bottom-spacer" aria-hidden="true" />
      <ConsentBanner />
    </>
  );
}
