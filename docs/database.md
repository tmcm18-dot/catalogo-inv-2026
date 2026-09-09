# Base de datos (Fase 1)

## Stack

- PostgreSQL
- Prisma ORM (`prisma/schema.prisma`)
- Migración inicial: `prisma/migrations/20260806000000_init_auth_phase_1`

## Desarrollo local

```bash
npm run db:dev          # Embedded Postgres → imprime DATABASE_URL
# En otra terminal, con DATABASE_URL exportada:
npm run db:generate
npm run db:migrate:deploy
npm run db:seed         # roles + permisos (admin opcional vía SEED_ADMIN_*)
npm run admin:create    # SUPERADMIN interactivo (recomendado)
```

## Modelos centrales

Usuarios, perfiles, credenciales, roles/permisos, sesiones, tokens de verificación/reset, 2FA, intentos de login, eventos de seguridad, auditoría, consentimientos.

Modelos preparatorios (no cableados a UI): `Cart`, `CartItem`.

## Migraciones

- Fase 1: `prisma/migrations/20260806000000_init_auth_phase_1`
- Fase 2: `prisma/migrations/20260806120000_auth_phase_2_admin_security`
  - `User.blockedUntil`, `suspendedAt`, `suspendedReason`
  - `AuditLog` + `result`, `requestId`, `reason`, `ipHash`, `userAgentHash`
  - `SensitiveActionGrant`, `RateLimitCounter`
  - Enums `AuditResult`, `SensitiveActionScope`

## Seed seguro

- **No** hay contraseña de admin fija en el repositorio.
- Seed opcional de admin solo si `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` están definidos y `NODE_ENV !== production`.
- Preferir `npm run admin:create`.
- Fase 2 amplía permisos (`users.read`, `users.suspend`, `sessions.*`, `roles.read`, `permissions.read`, `security.view_sensitive`, etc.).

## Variables

Ver `.env.example`: `DATABASE_URL`, `APP_ORIGIN`, `SESSION_SECRET`, `TOTP_ENCRYPTION_KEY`, `CAPTCHA_PROVIDER`, `REDIS_URL` (opcional), etc.
