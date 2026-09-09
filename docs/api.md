# API Auth / Account (Fase 1)

Formato de respuesta:

```json
{ "data": { }, "meta": { "requestId": "..." } }
```

```json
{ "error": { "code": "...", "message": "...", "requestId": "..." } }
```

Caché: respuestas privadas con `Cache-Control: private, no-store` donde aplica el helper JSON.

## Auth

| Método | Ruta | Notas |
|--------|------|-------|
| POST | `/api/auth/register` | Cliente |
| POST | `/api/auth/login` | Body: identifier, password, rememberMe; `adminContext` para admin |
| POST | `/api/auth/logout` | |
| POST | `/api/auth/logout-all` | |
| GET | `/api/auth/session` | |
| POST | `/api/auth/verify-email` | |
| POST | `/api/auth/resend-verification` | |
| POST | `/api/auth/forgot-password` | Respuesta genérica |
| POST | `/api/auth/reset-password` | |
| POST | `/api/auth/2fa/setup` | |
| POST | `/api/auth/2fa/confirm` | |
| POST | `/api/auth/2fa/verify` | Challenge admin |
| POST | `/api/auth/2fa/disable` | |
| POST | `/api/auth/2fa/recovery` | |

## Account

| Método | Ruta |
|--------|------|
| GET/PATCH | `/api/account/profile` |
| GET | `/api/account/sessions` |
| DELETE | `/api/account/sessions` (revocar por id vía body/query según ruta) |

## Admin security (Fase 2)

| Método | Ruta | Permiso |
|--------|------|---------|
| GET | `/api/admin/security/overview` | `security.manage` |
| GET | `/api/admin/security/risk` | `security.manage` |
| GET | `/api/admin/users` | `users.read` |
| GET | `/api/admin/users/[id]` | `users.read` |
| POST | `/api/admin/users/[id]/activate` | `users.manage` |
| POST | `/api/admin/users/[id]/suspend` | `users.suspend` (+ reauth si admin) |
| POST | `/api/admin/users/[id]/reactivate` | `users.suspend` |
| POST | `/api/admin/users/[id]/block` | `users.manage` |
| POST/DELETE | `/api/admin/users/[id]/roles` | `roles.manage` + reauth |
| POST | `/api/admin/users/[id]/sessions/revoke-all` | `sessions.revoke` |
| GET | `/api/admin/sessions` | `sessions.read` |
| POST | `/api/admin/sessions/[id]/revoke` | `sessions.revoke` |
| GET | `/api/admin/audit` | `audit.read` |
| GET | `/api/admin/roles` | `roles.read` |
| POST | `/api/admin/reauth/confirm` | admin + 2FA |
| POST | `/api/auth/login-risk` | público (sin enumeración) |

## Carts

| Método | Ruta | Notas |
|--------|------|-------|
| POST | `/api/carts/merge` | Stub Fase 1; carrito UI sigue en localStorage |

Todas las mutaciones validan Origin, esquema Zod y sesión/permisos cuando corresponde.
