# Seguridad (Fase 1)

## Controles implementados

- Contraseñas: Argon2id (`memoryCost=19456`, `timeCost=2`, `parallelism=1`)
- Tokens: `crypto.randomBytes` + SHA-256 antes de persistir
- Sesiones opacas; sin tokens en `localStorage`
- Cookies HttpOnly + SameSite=Lax; `__Host-` en producción
- Validación de Origin en mutaciones (`assertTrustedOrigin`)
- Rate limiting de login + bloqueo temporal progresivo
- 2FA TOTP obligatorio para operar el panel admin (secretos cifrados AES-GCM)
- Códigos de recuperación hasheados
- Auditoría de acciones sensibles / denegaciones
- Mensajes de error sin enumeración de cuentas

## Cabeceras

Configurar CSP/HSTS en despliegue (Next.js `headers`). Fase 1 no fuerza una CSP que rompa el catálogo existente.

## Secretos

Nunca versionar `.env`. Rotar `TOTP_ENCRYPTION_KEY` / `SESSION_SECRET` invalida secretos/sesiones según el caso.

## Pruebas de seguridad pendientes (fases posteriores)

IDOR exhaustivo, CSRF E2E, fuzzing, revisión de logs en Preview/Prod.
