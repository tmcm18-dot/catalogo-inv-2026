import { ArrowLeft, BookOpen, Layers3, Package, Tags } from 'lucide-react';
import { catalogBrands, catalogHotspots, catalogPages, catalogProducts } from '@/lib/catalog';
import AdminMetricCard from './AdminMetricCard';
import AdminNavigation from './AdminNavigation';
import AdminStatus from './AdminStatus';

type AdminDashboardProps = {
  onReturnToCatalog: () => void;
};

const metrics = [
  {
    label: 'Páginas del catálogo',
    value: catalogPages.length,
    description: 'Páginas declaradas',
    icon: BookOpen,
    tone: 'terracotta',
  },
  {
    label: 'Productos',
    value: catalogProducts.length,
    description: 'Registros en products.json',
    icon: Package,
    tone: 'blue',
  },
  {
    label: 'Marcas',
    value: catalogBrands.length,
    description: 'Registros en brands.json',
    icon: Tags,
    tone: 'green',
  },
  {
    label: 'Hotspots',
    value: catalogHotspots.length,
    description: 'Regiones declaradas',
    icon: Layers3,
    tone: 'violet',
  },
] as const;

export default function AdminDashboard({ onReturnToCatalog }: AdminDashboardProps) {
  return (
    <section className="adminShell" aria-label="Panel administrativo del catálogo">
      <aside className="adminSidebar">
        <div className="adminBrand">
          <span className="adminBrandMark" aria-hidden="true">INV</span>
          <span className="adminBrandText">
            <strong>Catálogo INV</strong>
            <small>Temporada 2026</small>
          </span>
        </div>

        <div className="adminSidebarStatus">
          <span className="adminStatusDot" aria-hidden="true" />
          <span>Panel administrativo</span>
        </div>

        <AdminNavigation />

        <div className="adminSidebarFooter">
          <span className="adminFooterMark" aria-hidden="true">INV</span>
          <span>Catálogo estático · 2026</span>
        </div>
      </aside>

      <div className="adminContent">
        <header className="adminHeader">
          <div>
            <p className="adminEyebrow">CATÁLOGO INV 2026</p>
            <h1>Resumen</h1>
            <p className="adminHeaderDescription">
              Una vista general de la estructura y los datos del catálogo.
            </p>
          </div>
          <button className="adminReturnButton" type="button" onClick={onReturnToCatalog}>
            <ArrowLeft size={17} aria-hidden="true" />
            <span>Volver a la revista</span>
          </button>
        </header>

        <div className="adminMain">
          <section aria-labelledby="admin-metrics-title">
            <div className="adminSectionHeading">
              <div>
                <p className="adminEyebrow">VISTA GENERAL</p>
                <h2 id="admin-metrics-title">Indicadores del catálogo</h2>
              </div>
              <span className="adminReadOnlyLabel">Datos de solo lectura</span>
            </div>
            <div className="adminMetricGrid">
              {metrics.map((metric) => (
                <AdminMetricCard key={metric.label} {...metric} />
              ))}
            </div>
          </section>

          <AdminStatus />
        </div>
      </div>
    </section>
  );
}
