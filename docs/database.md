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

## Seed seguro

- **No** hay contraseña de admin fija en el repositorio.
- Seed opcional de admin solo si `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` están definidos y `NODE_ENV !== production`.
- Preferir `npm run admin:create`.

## Variables

Ver `.env.example`: `DATABASE_URL`, `APP_ORIGIN`, `SESSION_SECRET`, `TOTP_ENCRYPTION_KEY`, etc.
