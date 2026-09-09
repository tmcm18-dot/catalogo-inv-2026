import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  clearSessionCookie,
  readSessionToken,
  requireValidSession,
  revokeSessionByToken,
} from '@/modules/auth/services/session-service';

async function logoutAction() {
  'use server';
  const token = await readSessionToken();
  if (token) await revokeSessionByToken(token, 'LOGOUT');
  await clearSessionCookie();
  redirect('/');
}

export default async function PerfilPage() {
  let session;
  try {
    session = await requireValidSession();
  } catch {
    redirect('/cuenta/iniciar-sesion');
  }

  return (
    <section className="authCard">
      <h1>Mi perfil</h1>
      <p>
        {session.user.firstName} {session.user.lastName}
      </p>
      <p>{session.user.email}</p>
      <p>{session.user.phone}</p>
      <p>Roles: {session.user.roles.join(', ')}</p>
      <div className="authFooter">
        <Link href="/cuenta/sesiones">Sesiones</Link>
        <Link href="/cuenta/seguridad">Seguridad</Link>
        <Link href="/">Volver al catálogo</Link>
      </div>
      <form action={logoutAction}>
        <button type="submit" className="authSubmit">
          Cerrar sesión
        </button>
      </form>
    </section>
  );
}
