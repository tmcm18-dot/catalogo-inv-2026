import { redirect } from 'next/navigation';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import { catalogBrands, catalogPages, catalogProducts, getHotspotsByPage } from '@/lib/catalog';
import { requireAdminAccess } from '@/modules/authorization/services/authorization-service';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="adminMetric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default async function AdminHomePage() {
  try {
    await requireAdminAccess();
  } catch (error) {
    if (error instanceof ForbiddenError && error.code === 'TWO_FACTOR_REQUIRED') {
      redirect('/admin/seguridad');
    }
    if (error instanceof ForbiddenError) {
      redirect('/admin/acceso-denegado');
    }
    if (error instanceof UnauthorizedError) {
      redirect('/admin/iniciar-sesion');
    }
    redirect('/admin/iniciar-sesion');
  }

  const hotspotCount = catalogPages.reduce(
    (total, page) => total + getHotspotsByPage(page.pageNumber).length,
    0,
  );

  return (
    <section className="adminView">
      <h1>Panel administrador</h1>
      <p>Métricas de catálogo (datos JSON actuales). Ruta protegida por RBAC + 2FA.</p>
      <div className="metricsGrid">
        <Metric label="Páginas" value={`${catalogPages.length}/218`} />
        <Metric label="Productos extraídos" value={String(catalogProducts.length)} />
        <Metric label="Marcas" value={String(catalogBrands.length)} />
        <Metric label="Hotspots" value={String(hotspotCount)} />
      </div>
    </section>
  );
}
