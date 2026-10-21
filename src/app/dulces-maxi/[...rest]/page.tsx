import { notFound } from 'next/navigation';

/** Las rutas no definidas bajo /dulces-maxi usan el 404 propio de la tienda. */
export default function DulcesMaxiCatchAll() {
  notFound();
}
