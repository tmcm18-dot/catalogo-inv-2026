import {
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  MousePointer2,
  Package,
  Settings2,
  Tags,
  type LucideIcon,
} from 'lucide-react';

type AdminNavigationItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

const navigationItems: AdminNavigationItem[] = [
  { label: 'Resumen', icon: LayoutDashboard, active: true },
  { label: 'Productos', icon: Package },
  { label: 'Marcas', icon: Tags },
  { label: 'Páginas del catálogo', icon: BookOpen },
  { label: 'Hotspots', icon: MousePointer2 },
  { label: 'Auditoría', icon: ClipboardList },
  { label: 'Configuración', icon: Settings2 },
];

export default function AdminNavigation() {
  return (
    <nav className="adminNavigation" aria-label="Navegación administrativa">
      <p className="adminNavigationLabel">GESTIÓN DEL CATÁLOGO</p>
      {navigationItems.map(({ label, icon: Icon, active }) => (
        <button
          key={label}
          type="button"
          className={`adminNavigationItem${active ? ' isActive' : ''}`}
          aria-current={active ? 'page' : undefined}
          aria-label={active ? label : `${label}, próximamente`}
          disabled={!active}
        >
          <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>{label}</span>
          {!active && <small className="adminNavigationBadge">Próximamente</small>}
        </button>
      ))}
    </nav>
  );
}
