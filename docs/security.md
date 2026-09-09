# Seguridad (Fase 1 + Fase 2)

## Controles implementados

- Contraseñas: Argon2id (`memoryCost=19456`, `timeCost=2`, `parallelism=1`)
- Tokens: `crypto.randomBytes` + SHA-256 antes de persistir
- Sesiones opacas; sin tokens en `localStorage`
- Cookies HttpOnly + SameSite=Lax; `__Host-` en producción
- Validación de Origin en mutaciones (`assertTrustedOrigin`)
- Rate limiting multi-dimensión (`RateLimitStore` + `MemoryRateLimitStore`; Redis preparado, no obligatorio)
- Bloqueo temporal con `blockedUntil` (progresivo, no permanente)
- CAPTCHA adaptativo (Turnstile Managed en prod vía Siteverify; mock en desarrollo)
- 2FA TOTP obligatorio para operar el panel admin (secretos cifrados AES-GCM)
- Códigos de recuperación hasheados; regeneración admin con reauth
- `SensitiveActionGrant` (TTL 5 min, un scope, un uso, solo hash)
- Auditoría enriquecida: actor, acción, recurso, resultado, requestId, razón, IP/UA seudonimizados
- Mensajes de error sin enumeración de cuentas

## Rate limiting y Redis

Por defecto se usa memoria de proceso (`MemoryRateLimitStore`), adecuada para desarrollo y pruebas.

Para un despliegue **multi-instancia** configurá un store compartido:

```bash
RATE_LIMIT_STORE=redis
REDIS_URL=redis://...
```

`RedisRateLimitStore` está preparado pero no es dependencia obligatoria de desarrollo. Sin `REDIS_URL`, no intentes forzar Redis.

## CAPTCHA

```bash
CAPTCHA_PROVIDER=mock          # desarrollo / CI
# CAPTCHA_PROVIDER=turnstile   # producción
# TURNSTILE_SITE_KEY=
# TURNSTILE_SECRET_KEY=
```

No versionar claves reales. El widget solo aparece cuando el riesgo lo requiere.

## Cabeceras

Configurar CSP/HSTS en despliegue (Next.js `headers`). No forzar una CSP que rompa el catálogo existente.

## Secretos

Nunca versionar `.env` ni variantes (`.env.local`, `.env.e2e`, etc.). Solo
`.env.example` con placeholders. Rotar `TOTP_ENCRYPTION_KEY` / `SESSION_SECRET`
invalida secretos/sesiones según el caso.

## Pruebas E2E auth (local)

Usá una base PostgreSQL embebida aislada (`npm run db:dev`) y la app en
**`npm run dev`** (el flujo validado). Las cookies `__Host-` / `Secure` de
producción no se debilitan para HTTP local: en `http://127.0.0.1` preferí
`next dev`; si usás `next start` con cookies de producción, apuntá a
`http://localhost` (Chromium trata localhost como contexto seguro).

```bash
# App + DB locales (nunca Production)
npm run db:dev
# exportá en memoria: DATABASE_URL, APP_ORIGIN, SESSION_SECRET,
# TOTP_ENCRYPTION_KEY, FIELD_ENCRYPTION_KEY, CAPTCHA_PROVIDER=mock
# y las variables E2E_* (emails, passwords, secretos TOTP Base32)
npm run db:migrate:deploy
npm run e2e:seed-auth

npm run dev
# otra terminal:
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:3000'
# workers=1: los casos 5/6 mutan los mismos SUPERADMIN
npx playwright test e2e/admin-security.spec.ts --workers=1
```

`playwright.config.ts` exige `PLAYWRIGHT_BASE_URL` y rechaza Production.

Sin variables `E2E_*`, los casos autenticados se omiten (`test.skip`) y corren
solo los smoke de acceso.

## Pendientes documentados (no bloquean Fase 2)

- **Redis obligatorio antes de multi-instancia**: MemoryStore es solo local;
  configurá `RATE_LIMIT_STORE=redis` + `REDIS_URL` en despliegues con más de
  un proceso.
- CAPTCHA adaptativo en `/cuenta/iniciar-sesion`: mejora posterior de autenticación de clientes.
- Carrito autenticado: Fase 3.
