import { NextRequest, NextResponse } from 'next/server';
import { ANONYMOUS_COOKIE_NAME } from '@/lib/security/cookies';

function sessionCookieName(): string {
  return process.env.NODE_ENV === 'production' ? '__Host-app_session' : 'app_session';
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next();

  if (!request.cookies.get(ANONYMOUS_COOKIE_NAME)?.value) {
    const anonymousId = crypto.randomUUID();
    response.cookies.set(ANONYMOUS_COOKIE_NAME, anonymousId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });
  }

  const hasSession = request.cookies.has(sessionCookieName());

  const publicAdminPaths = [
    '/admin/iniciar-sesion',
    '/admin/verificar-2fa',
  ];

  if (
    path.startsWith('/admin') &&
    !publicAdminPaths.some((p) => path.startsWith(p)) &&
    !hasSession
  ) {
    const loginUrl = new URL('/admin/iniciar-sesion', request.url);
    loginUrl.searchParams.set('returnTo', path);
    return NextResponse.redirect(loginUrl);
  }

  const publicCuentaPaths = [
    '/cuenta/iniciar-sesion',
    '/cuenta/crear-cuenta',
    '/cuenta/verificar',
    '/cuenta/recuperar-contrasena',
    '/cuenta/restablecer-contrasena',
  ];

  if (
    path.startsWith('/cuenta') &&
    !publicCuentaPaths.some((p) => path.startsWith(p)) &&
    !hasSession
  ) {
    const loginUrl = new URL('/cuenta/iniciar-sesion', request.url);
    loginUrl.searchParams.set('returnTo', path);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/cuenta/:path*', '/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
