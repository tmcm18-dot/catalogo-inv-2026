import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';
import {
  PrismaClient,
  RoleCode,
  UserStatus,
  SensitiveActionScope,
} from '@prisma/client';
import { hashPassword, verifyPassword } from '@/lib/security/password';
import { createSecureToken, hashToken } from '@/lib/security/tokens';
import { createRecoveryCodes } from '@/lib/security/totp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const databaseDir = path.join(root, '.pgdata-test-phase2');
const port = 54341;
const database = 'catalogo_inv2026_phase2';
const user = 'postgres';
const password = 'postgres';

const runIntegration = process.env.AUTH_INTEGRATION !== '0';

describe.skipIf(!runIntegration)('admin security phase 2 integration', () => {
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
      // already initialized
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

    for (const code of [
      'users.read',
      'users.manage',
      'users.suspend',
      'roles.manage',
      'sessions.revoke',
      'audit.read',
      'security.manage',
      'analytics.read_basic',
    ]) {
      const [module, action] = code.split('.');
      await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, module, action, description: code },
      });
    }

    for (const role of [
      { code: RoleCode.CUSTOMER, name: 'Cliente' },
      { code: RoleCode.SELLER, name: 'Seller' },
      { code: RoleCode.ADMIN, name: 'Admin' },
      { code: RoleCode.SUPERADMIN, name: 'Super' },
    ]) {
      await prisma.role.upsert({
        where: { code: role.code },
        update: { name: role.name },
        create: role,
      });
    }
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    try {
      await pg?.stop();
    } catch {
      // ignore
    }
  });

  it('persists blockedUntil and SensitiveActionGrant hash-only', async () => {
    const passwordHash = await hashPassword('SuperSecret1!');
    const superRole = await prisma.role.findUniqueOrThrow({
      where: { code: RoleCode.SUPERADMIN },
    });

    const email = `phase2-super-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        normalizedEmail: email,
        status: UserStatus.ACTIVE,
        credentials: { create: { passwordHash } },
        userRoles: { create: { roleId: superRole.id } },
        profile: { create: { firstName: 'Phase', lastName: 'Two' } },
      },
    });

    const blockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { status: UserStatus.TEMPORARILY_BLOCKED, blockedUntil },
    });

    const reloaded = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(reloaded.blockedUntil?.getTime()).toBe(blockedUntil.getTime());

    const token = createSecureToken(32);
    await prisma.sensitiveActionGrant.create({
      data: {
        userId: user.id,
        sessionId: 'sess_test',
        tokenHash: hashToken(token),
        scope: SensitiveActionScope.roles_manage,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const grant = await prisma.sensitiveActionGrant.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(grant.tokenHash).toBe(hashToken(token));
    expect(grant.tokenHash).not.toBe(token);

    const ok = await verifyPassword(passwordHash, 'SuperSecret1!');
    expect(ok).toBe(true);

    const recovery = createRecoveryCodes(2);
    expect(recovery.plain).toHaveLength(2);
    expect(recovery.hashes[0]).not.toBe(recovery.plain[0]);
  });

  it('counts last superadmin role assignment', async () => {
    const count = await prisma.userRole.count({
      where: {
        role: { code: RoleCode.SUPERADMIN },
        user: { deletedAt: null, status: { not: UserStatus.DELETED } },
      },
    });
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('audit log accepts Phase 2 fields', async () => {
    const log = await prisma.auditLog.create({
      data: {
        action: 'admin.user.suspend',
        resourceType: 'user',
        resourceId: 'x',
        result: 'DENIED',
        requestId: 'req_test',
        reason: 'LAST_SUPERADMIN',
        ipHash: hashToken('127.0.0.1'),
        userAgentHash: hashToken('vitest'),
      },
    });
    expect(log.result).toBe('DENIED');
    expect(log.requestId).toBe('req_test');
  });
});
