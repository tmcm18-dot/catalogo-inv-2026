# Autorización (Fase 1 + Fase 2)

## Principio

Ocultar UI no es seguridad. Toda operación sensible se valida en servidor:

- Layouts / Server Components
- Route Handlers
- Servicios de aplicación

El middleware solo comprueba presencia de cookie de sesión (primera barrera).

## Roles

| Rol | Uso |
|-----|-----|
| `CUSTOMER` | Cliente registrado |
| `SELLER` | Vendedor (clientes/pedidos asignados) |
| `ADMIN` | Operación administrativa |
| `SUPERADMIN` | Roles, permisos, seguridad crítica |

## Permisos de seguridad (Fase 2)

| Permiso | ADMIN | SUPERADMIN |
|---------|-------|------------|
| `users.read` / `users.manage` / `users.suspend` | sí* | sí |
| `sessions.read` / `sessions.revoke` | sí* | sí |
| `roles.read` / `permissions.read` | sí | sí |
| `roles.manage` | no | sí |
| `audit.read` / `security.manage` | sí | sí |
| `security.view_sensitive` / `system.configure` / `ai.approve_actions` | no | sí |

\* ADMIN no gestiona cuentas SUPERADMIN. Nadie se auto-eleva. No se puede degradar/suspender al último SUPERADMIN activo.

Asignación en `prisma/seed.ts`.

## API de autorización

```ts
await requirePermission('analytics.read_basic');
await requireAdminSession();      // admin context; 2FA puede estar pendiente
await requireAdminAccess();       // admin + 2FA OK + permiso básico
await requireAdminPermission('users.read'); // admin + 2FA OK + permiso concreto
```

`userHasPermission` ignora roles con `expiresAt` vencido.

## Reglas de acceso

- Cliente que entra a `/admin` → acceso denegado (403 / redirección).
- Admin sin 2FA completo no entra al dashboard ni a usuarios/sesiones/auditoría/riesgo; solo a setup 2FA.
- Las denegaciones se auditan (`authorization.denied`, `result=DENIED`).
