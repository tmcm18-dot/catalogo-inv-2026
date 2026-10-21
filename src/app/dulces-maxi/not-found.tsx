import Link from 'next/link';
import { DM_BASE } from '@/lib/dulces-maxi/products';

export default function DulcesMaxiNotFound() {
  return (
    <div className="dm-404">
      <div className="dm-404__box">
        <div className="dm-404__code">404</div>
        <div className="dm-404__rule" />
        <h2>Página no encontrada</h2>
        <p>La página que buscás no existe en Dulces Maxi.</p>
        <Link href={DM_BASE} className="dm-btn dm-btn--primary">
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
