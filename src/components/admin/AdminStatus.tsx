import { Braces, Check, FileImage, MousePointer2 } from 'lucide-react';

const dataSources = [
  {
    label: 'Productos y marcas',
    source: 'src/data/products.json · src/data/brands.json',
    icon: Braces,
  },
  {
    label: 'Páginas del catálogo',
    source: 'src/data/catalog-pages.json · public/assets/catalogo/pages/',
    icon: FileImage,
  },
  {
    label: 'Hotspots',
    source: 'src/data/hotspots.json',
    icon: MousePointer2,
  },
];

export default function AdminStatus() {
  return (
    <section className="adminStatusGrid" aria-label="Estado y fuentes del catálogo">
      <article className="adminPanel adminSourcesPanel">
        <div className="adminPanelHeading">
          <div>
            <p className="adminEyebrow">TRANSPARENCIA DE DATOS</p>
            <h2>Origen de la información</h2>
          </div>
          <span className="adminStatusBadge">
            <Check size={14} aria-hidden="true" />
            Datos locales
          </span>
        </div>
        <p className="adminPanelDescription">
          El catálogo se construye con archivos estáticos incluidos en el proyecto.
        </p>
        <div className="adminSourceList">
          {dataSources.map(({ label, source, icon: Icon }) => (
            <div className="adminSourceItem" key={label}>
              <span className="adminSourceIcon" aria-hidden="true">
                <Icon size={17} strokeWidth={1.8} />
              </span>
              <div>
                <h3>{label}</h3>
                <code>{source}</code>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="adminPanel adminPhasePanel">
        <p className="adminEyebrow">ESTADO DEL SISTEMA</p>
        <h2>Base informativa</h2>
        <span className="adminStaticBadge">
          <span aria-hidden="true" />
          Configuración estática
        </span>
        <p className="adminPanelDescription">
          Los datos se leen desde JSON. Este panel no incorpora backend,
          sincronización, autenticación ni operaciones de edición.
        </p>
        <div className="adminPhaseNote">
          <strong>Fase 1</strong>
          <span>Estructura visual y navegación preparadas para ampliaciones futuras.</span>
        </div>
      </article>
    </section>
  );
}
