import { PrismaClient, RoleCode } from '@prisma/client';
import { hashPassword } from '../src/lib/security/password.ts';

const prisma = new PrismaClient();

const PERMISSIONS: Array<{ code: string; module: string; action: string; description: string }> = [
  { code: 'catalog.read', module: 'catalog', action: 'read', description: 'Leer catálogo' },
  { code: 'catalog.manage', module: 'catalog', action: 'manage', description: 'Administrar catálogo' },
  { code: 'products.read', module: 'products', action: 'read', description: 'Leer productos' },
  { code: 'products.manage', module: 'products', action: 'manage', description: 'Administrar productos' },
  { code: 'analytics.read_basic', module: 'analytics', action: 'read_basic', description: 'Métricas básicas' },
  { code: 'analytics.read_sensitive', module: 'analytics', action: 'read_sensitive', description: 'Métricas sensibles' },
  { code: 'users.read', module: 'users', action: 'read', description: 'Consultar usuarios' },
  { code: 'users.manage', module: 'users', action: 'manage', description: 'Administrar usuarios' },
  { code: 'users.suspend', module: 'users', action: 'suspend', description: 'Suspender o reactivar usuarios' },
  { code: 'sessions.read', module: 'sessions', action: 'read', description: 'Consultar sesiones' },
  { code: 'sessions.revoke', module: 'sessions', action: 'revoke', description: 'Revocar sesiones' },
  { code: 'roles.read', module: 'roles', action: 'read', description: 'Consultar roles' },
  { code: 'roles.manage', module: 'roles', action: 'manage', description: 'Asignar y retirar roles' },
  { code: 'permissions.read', module: 'permissions', action: 'read', description: 'Consultar permisos' },
  { code: 'permissions.manage', module: 'permissions', action: 'manage', description: 'Administrar permisos' },
  { code: 'audit.read', module: 'audit', action: 'read', description: 'Leer auditoría' },
  { code: 'security.manage', module: 'security', action: 'manage', description: 'Administrar seguridad' },
  { code: 'security.view_sensitive', module: 'security', action: 'view_sensitive', description: 'Ver datos sensibles de seguridad' },
  { code: 'system.configure', module: 'system', action: 'configure', description: 'Configuración crítica' },
  { code: 'orders.create', module: 'orders', action: 'create', description: 'Crear pedidos' },
  { code: 'orders.read_own', module: 'orders', action: 'read_own', description: 'Leer pedidos propios' },
  { code: 'orders.read_assigned', module: 'orders', action: 'read_assigned', description: 'Leer pedidos asignados' },
  { code: 'orders.read_all', module: 'orders', action: 'read_all', description: 'Leer todos los pedidos' },
  { code: 'orders.update_assigned', module: 'orders', action: 'update_assigned', description: 'Actualizar pedidos asignados' },
  { code: 'orders.update_all', module: 'orders', action: 'update_all', description: 'Actualizar todos los pedidos' },
  { code: 'customers.read_all', module: 'customers', action: 'read_all', description: 'Leer todos los clientes' },
  { code: 'customers.read_assigned', module: 'customers', action: 'read_assigned', description: 'Leer clientes asignados' },
  { code: 'customers.update_assigned', module: 'customers', action: 'update_assigned', description: 'Actualizar clientes asignados' },
  { code: 'customers.update_all', module: 'customers', action: 'update_all', description: 'Actualizar todos los clientes' },
  { code: 'promotions.manage', module: 'promotions', action: 'manage', description: 'Administrar promociones' },
  { code: 'ai.use_admin_copilot', module: 'ai', action: 'use_admin_copilot', description: 'Usar copiloto admin' },
  { code: 'ai.approve_actions', module: 'ai', action: 'approve_actions', description: 'Aprobar acciones de IA' },
];

const ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  CUSTOMER: ['catalog.read', 'products.read', 'orders.create', 'orders.read_own'],
  SELLER: [
    'catalog.read',
    'products.read',
    'customers.read_assigned',
    'customers.update_assigned',
    'orders.read_assigned',
    'orders.update_assigned',
    'orders.read_own',
  ],
  ADMIN: [
    'catalog.read',
    'catalog.manage',
    'products.read',
    'products.manage',
    'analytics.read_basic',
    'analytics.read_sensitive',
    'customers.read_all',
    'customers.update_all',
    'orders.read_all',
    'orders.update_all',
    'promotions.manage',
    'users.read',
    'users.manage',
    'users.suspend',
    'sessions.read',
    'sessions.revoke',
    'roles.read',
    'permissions.read',
    'audit.read',
    'security.manage',
    'ai.use_admin_copilot',
  ],
  SUPERADMIN: PERMISSIONS.map((p) => p.code),
};

async function seedRolesAndPermissions() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
      create: permission,
    });
  }

  const roleDefs: Array<{ code: RoleCode; name: string; description: string }> = [
    { code: 'CUSTOMER', name: 'Cliente', description: 'Cliente registrado' },
    { code: 'SELLER', name: 'Vendedor', description: 'Vendedor interno' },
    { code: 'ADMIN', name: 'Administrador', description: 'Administrador operativo' },
    { code: 'SUPERADMIN', name: 'Superadministrador', description: 'Administración crítica' },
  ];

  for (const role of roleDefs) {
    const saved = await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    });

    const permissionCodes = ROLE_PERMISSIONS[role.code];
    const permissions = await prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: saved.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: saved.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

/**
 * Optional SUPERADMIN bootstrap for local/dev only.
 * Requires SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD (no defaults).
 * Prefer `npm run admin:create` for interactive bootstrap.
 */
async function seedOptionalDevAdmin() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping optional admin seed in production. Use npm run admin:create.');
    return;
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log(
      'No SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD — roles seeded only. Use npm run admin:create.',
    );
    return;
  }

  if (adminPassword.length < 10 || adminPassword.length > 128) {
    throw new Error('SEED_ADMIN_PASSWORD must be between 10 and 128 characters.');
  }

  const normalizedEmail = adminEmail.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { normalizedEmail } });
  if (existing) {
    console.log(`SUPERADMIN ${adminEmail} already exists`);
    return;
  }

  const passwordHash = await hashPassword(adminPassword);
  const superRole = await prisma.role.findUniqueOrThrow({ where: { code: 'SUPERADMIN' } });

  await prisma.user.create({
    data: {
      email: adminEmail,
      normalizedEmail,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
        },
      },
      credentials: { create: { passwordHash } },
      userRoles: { create: { roleId: superRole.id } },
      consentRecords: {
        create: [
          { kind: 'terms', granted: true, version: '1' },
          { kind: 'privacy', granted: true, version: '1' },
        ],
      },
    },
  });

  console.log(`Seeded SUPERADMIN ${adminEmail}`);
  console.log('IMPORTANT: configure TOTP on first admin login (/admin/seguridad/2fa).');
}

async function main() {
  await seedRolesAndPermissions();
  await seedOptionalDevAdmin();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
