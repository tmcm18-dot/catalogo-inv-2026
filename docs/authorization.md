# Autorización (Fase 1)

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

## Permisos (seed)

Incluyen, entre otros: `catalog.read`, `products.manage`, `customers.read_all`, `orders.read_own`, `analytics.read_basic`, `audit.read`, `security.manage`, `roles.manage`, `ai.use_admin_copilot`.

Asignación inicial en `prisma/seed.ts`.

## API de autorización

```ts
await requirePermission('analytics.read_basic');
await requireAdminSession();   // admin context; 2FA puede estar pendiente
await requireAdminAccess();    // admin + 2FA OK + permiso básico
```

`userHasPermission` ignora roles con `expiresAt` vencido.

## Reglas de acceso

- Cliente que entra a `/admin` → acceso denegado (403 / redirección).
- Admin sin 2FA completo no entra al dashboard; solo a `/admin/seguridad`.
- Las denegaciones se auditan (`authorization.denied`).
