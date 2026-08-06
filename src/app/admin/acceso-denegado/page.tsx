import Link from 'next/link';

export default function AccesoDenegadoPage() {
  return (
    <section className="authCard">
      <h1>Acceso denegado</h1>
      <p>No tenés permisos para esta sección.</p>
      <Link href="/">Volver al catálogo</Link>
    </section>
  );
}
