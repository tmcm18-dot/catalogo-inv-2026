import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { requireValidSession } from '@/modules/auth/services/session-service';

export default async function SesionesPage() {
  let session;
  try {
    session = await requireValidSession();
  } catch {
    redirect('/cuenta/iniciar-sesion');
  }

  const sessions = await prisma.session.findMany({
    where: {
      userId: session.userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActivityAt: 'desc' },
  });

  return (
    <section className="authCard">
      <h1>Sesiones activas</h1>
      <ul className="sessionList">
        {sessions.map((item) => (
          <li key={item.id}>
            <strong>{item.id === session.sessionId ? 'Esta sesión' : 'Otra sesión'}</strong>
            <span>
              Última actividad: {item.lastActivityAt.toLocaleString('es-AR')}
            </span>
            <span>Expira: {item.expiresAt.toLocaleString('es-AR')}</span>
          </li>
        ))}
      </ul>
      <div className="authFooter">
        <Link href="/cuenta/perfil">Volver al perfil</Link>
      </div>
    </section>
  );
}
