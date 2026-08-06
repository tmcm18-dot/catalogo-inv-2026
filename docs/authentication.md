# Autenticación (Fase 1)

## Resumen

Sistema de autenticación centralizado con sesiones opacas en PostgreSQL, cookies HttpOnly y RBAC. Interfaces separadas:

- Cliente: `/cuenta/*`
- Admin: `/admin/*`

Ambas usan los mismos servicios (`src/modules/auth`).

## Flujos

### Registro de cliente

1. `POST /api/auth/register` — crea usuario `PENDING_VERIFICATION`, perfil, credencial Argon2id, consentimientos y token de verificación (hash en DB).
2. Email stub envía enlace a `/cuenta/verificar?token=...` (logueado en consola en desarrollo).
3. `POST /api/auth/verify-email` — activa cuenta (`ACTIVE`).
4. Login posterior crea sesión y cookie.

### Login

- Identificador: correo o teléfono.
- Errores genéricos (`INVALID_CREDENTIALS`) sin enumeración de cuentas.
- Hash ficticio Argon2id para igualar tiempos cuando la cuenta no existe.
- Rate limiting progresivo + bloqueo temporal (`TEMPORARILY_BLOCKED`) tras fallos repetidos.

### Sesiones

| Contexto | Duración |
|----------|----------|
| Cliente estándar | 7 días |
| Cliente “recordarme” | 30 días |
| Admin absoluta | 8 horas |
| Admin inactividad | 20 minutos |

Cookie: `app_session` (dev) / `__Host-app_session` (prod). Solo se almacena el token aleatorio; en DB se guarda SHA-256.

### Recuperación de contraseña

1. `POST /api/auth/forgot-password` — respuesta siempre genérica.
2. Token de un solo uso (15–30 min), invalida tokens previos.
3. `POST /api/auth/reset-password` — actualiza hash, consume token, revoca sesiones.

### Admin + 2FA

- Login admin con TOTP configurado → challenge cookie → `/admin/verificar-2fa`.
- Login admin sin TOTP → sesión con `twoFactorOk=false` → obligatorio `/admin/seguridad`.
- `requireAdminAccess` exige RBAC + contexto admin + `twoFactorOk`.

## Email

Transporte stub intercambiable (`EmailTransport` en `email-service.ts`). No se envían correos reales en Fase 1.

## Carrito

El carrito del catálogo sigue en `localStorage`. Modelos `Cart`/`CartItem` existen en Prisma como preparación de Fase 3; no son autoritativos todavía.
