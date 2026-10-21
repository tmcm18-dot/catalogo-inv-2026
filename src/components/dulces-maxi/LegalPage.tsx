import { TriangleAlert } from 'lucide-react';
import { LEGAL_PAGES, type LegalPageType } from '@/lib/dulces-maxi/legal';

export default function LegalPage({ type }: { type: LegalPageType }) {
  const content = LEGAL_PAGES[type] || LEGAL_PAGES.terminos;
  return (
    <article className="dm-container dm-legal">
      <div className="dm-legal__draft">
        <p>
          <TriangleAlert size={20} /> Borrador pendiente de revisión
        </p>
        <p>
          Este texto es operativo y no constituye asesoramiento legal. Debe revisarlo el responsable del
          negocio o un profesional competente antes del lanzamiento público.
        </p>
      </div>
      <h1>{content.title}</h1>
      <div className="dm-legal__sections">
        {content.sections.map(([title, body]) => (
          <section key={title} className="dm-legal__section">
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
