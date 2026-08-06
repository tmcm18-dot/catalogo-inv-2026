# Autenticación (Fase 1 + Fase 2)

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
- Rate limiting progresivo + bloqueo temporal (`TEMPORARILY_BLOCKED` + `blockedUntil`).
- CAPTCHA adaptativo: solo cuando el riesgo lo exige (`POST /api/auth/login-risk` + token en login).

### Sesiones

| Contexto | Duración |
|----------|----------|
| Cliente estándar | 7 días |
| Cliente “recordarme” | 30 días |
| Admin absoluta | 8 horas |
| Admin inactividad | 20 minutos |

- `lastActivityAt` se actualiza con ventana de 60s (no en cada request).
- Rotación tras elevar privilegios / confirmar 2FA.
- Revocación en cambio de contraseña, suspensión e inactividad admin.
- Grants de reauth se invalidan al revocar/rotar sesión.

Cookie: `app_session` (dev) / `__Host-app_session` (prod). Solo se almacena el token aleatorio; en DB se guarda SHA-256.

### Recuperación de contraseña

1. `POST /api/auth/forgot-password` — respuesta siempre genérica.
2. Token de un solo uso (15–30 min), invalida tokens previos.
3. `POST /api/auth/reset-password` — actualiza hash, consume token, revoca sesiones y grants.

### Admin + 2FA

- Login admin con TOTP configurado → challenge cookie → `/admin/verificar-2fa`.
- Login admin sin TOTP → sesión con `twoFactorOk=false` → solo `/admin/seguridad` y `/admin/seguridad/2fa`.
- `requireAdminAccess` exige RBAC + contexto admin + `twoFactorOk`.
- Regeneración de códigos de recuperación (admin) exige `SensitiveActionGrant` (`two_factor.regenerate_recovery_codes`).

### Reautenticación (Fase 2)

`POST /api/admin/reauth/confirm` con contraseña + TOTP (admins) emite un grant de 5 minutos, un scope, un solo uso. Solo se guarda el hash.

### Panel `/admin/seguridad/*` (Fase 2)

Subrutas: hub, usuarios, detalle, sesiones, auditoría, riesgo, 2FA. Nunca muestra contraseñas, hashes, tokens, cookies ni secretos TOTP.

### CAPTCHA adaptativo (Fase 2)

- Probe: `POST /api/auth/login-risk`
- Widget: `AdaptiveCaptcha` (mock en desarrollo; Turnstile Managed si `CAPTCHA_PROVIDER=turnstile`)
- Clave pública: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (nunca el secret)
- Validación: Siteverify en servidor con `TURNSTILE_SECRET_KEY`
- Mock prohibido en producción salvo `CAPTCHA_ALLOW_MOCK=1`

### Reautenticación UI (Fase 2)

Modal accesible en detalle de usuario → `/api/admin/reauth/confirm` → acción con `grantToken` en memoria (sin localStorage/sessionStorage).

## Email

Transporte stub intercambiable (`EmailTransport` en `email-service.ts`). No se envían correos reales en Fase 1/2.

## Carrito

El carrito del catálogo sigue en `localStorage`. Modelos `Cart`/`CartItem` existen en Prisma como preparación de Fase 3; no son autoritativos todavía.
