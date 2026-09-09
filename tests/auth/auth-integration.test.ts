import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';
import { PrismaClient, RoleCode, UserStatus } from '@prisma/client';
import { hashPassword, verifyPassword } from '@/lib/security/password';
import { createSecureToken, hashToken } from '@/lib/security/tokens';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const databaseDir = path.join(root, '.pgdata-test');
const port = 54339;
const database = 'catalogo_inv2026_test';
const user = 'postgres';
const password = 'postgres';

const runIntegration = process.env.AUTH_INTEGRATION !== '0';

describe.skipIf(!runIntegration)('auth integration smoke', () => {
  let pg: EmbeddedPostgres;
  let prisma: PrismaClient;

  beforeAll(async () => {
    mkdirSync(databaseDir, { recursive: true });
    pg = new EmbeddedPostgres({
      databaseDir,
      user,
      password,
      port,
      persistent: false,
    });

    try {
      await pg.initialise();
    } catch {
      // already initialized from a previous interrupted run
    }
    await pg.start();
    try {
      await pg.createDatabase(database);
    } catch {
      // exists
    }

    const url = `postgresql://${user}:${password}@127.0.0.1:${port}/${database}?schema=public`;
    process.env.DATABASE_URL = url;

    execSync('npx prisma migrate deploy', {
      cwd: root,
      env: { ...process.env, DATABASE_URL: url },
      stdio: 'pipe',
    });

    prisma = new PrismaClient({ datasources: { db: { url } } });
    await prisma.$connect();

    const permissions = [
      {
        code: 'catalog.read',
        module: 'catalog',
        action: 'read',
        description: 'Leer catálogo',
      },
      {
        code: 'orders.read_own',
        module: 'orders',
        action: 'read_own',
        description: 'Leer pedidos propios',
      },
      {
        code: 'analytics.read_basic',
        module: 'analytics',
        action: 'read_basic',
        description: 'Métricas básicas',
      },
    ];

    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: { code: permission.code },
        update: permission,
        create: permission,
      });
    }

    for (const role of [
      { code: RoleCode.CUSTOMER, name: 'Cliente' },
      { code: RoleCode.ADMIN, name: 'Admin' },
      { code: RoleCode.SUPERADMIN, name: 'Super' },
      { code: RoleCode.SELLER, name: 'Seller' },
    ]) {
      await prisma.role.upsert({
        where: { code: role.code },
        update: { name: role.name },
        create: role,
      });
    }

    const customer = await prisma.role.findUniqueOrThrow({
      where: { code: RoleCode.CUSTOMER },
    });
    const catalogRead = await prisma.permission.findUniqueOrThrow({
      where: { code: 'catalog.read' },
    });
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: customer.id,
          permissionId: catalogRead.id,
        },
      },
      update: {},
      create: { roleId: customer.id, permissionId: catalogRead.id },
    });
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    try {
      await pg?.stop();
    } catch {
      // ignore shutdown races on Windows
    }
  }, 60_000);

  it('registers, verifies email, creates session, and revokes on password reset', async () => {
    const email = `cliente-${Date.now()}@example.com`;
    const normalizedEmail = email.toLowerCase();
    const passwordHash = await hashPassword('clave-segura-10');
    const verifyToken = createSecureToken(32);
    const customerRole = await prisma.role.findUniqueOrThrow({
      where: { code: RoleCode.CUSTOMER },
    });

    const user = await prisma.user.create({
      data: {
        email,
        normalizedEmail,
        phone: `54911${String(Date.now()).slice(-8)}`,
        normalizedPhone: `54911${String(Date.now()).slice(-8)}`,
        status: UserStatus.PENDING_VERIFICATION,
        profile: { create: { firstName: 'Ana', lastName: 'Pérez' } },
        credentials: { create: { passwordHash } },
        userRoles: { create: { roleId: customerRole.id } },
        emailVerificationTokens: {
          create: {
            tokenHash: hashToken(verifyToken),
            expiresAt: new Date(Date.now() + 60_000),
          },
        },
      },
    });

    const tokenRow = await prisma.emailVerificationToken.findFirst({
      where: { tokenHash: hashToken(verifyToken), consumedAt: null },
    });
    expect(tokenRow).toBeTruthy();

    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.update({
        where: { id: tokenRow!.id },
        data: { consumedAt: new Date() },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() },
      });
    });

    const active = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(active.status).toBe(UserStatus.ACTIVE);
    expect(await verifyPassword(passwordHash, 'clave-segura-10')).toBe(true);

    const sessionToken = createSecureToken(32);
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(sessionToken),
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });
    expect(session.revokedAt).toBeNull();

    const resetToken = createSecureToken(32);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(resetToken),
        expiresAt: new Date(Date.now() + 30 * 60_000),
      },
    });

    const newHash = await hashPassword('nueva-clave-segura');
    await prisma.$transaction(async (tx) => {
      await tx.credential.updateMany({
        where: { userId: user.id },
        data: { passwordHash: newHash, passwordSetAt: new Date() },
      });
      await tx.passwordResetToken.updateMany({
        where: { userId: user.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await tx.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'PASSWORD_RESET' },
      });
    });

    const revoked = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(revoked.revokedAt).not.toBeNull();
    expect(revoked.revokeReason).toBe('PASSWORD_RESET');

    const permissionCount = await prisma.userRole.count({
      where: {
        userId: user.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        role: {
          permissions: { some: { permission: { code: 'catalog.read' } } },
        },
      },
    });
    expect(permissionCount).toBe(1);
  }, 60_000);
});
