/**
 * Seeds reproducible auth fixtures for local Playwright (never Production).
 *
 * Required env (no defaults for passwords):
 *   DATABASE_URL
 *   E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 *   E2E_ADMIN_2FA_EMAIL / E2E_ADMIN_2FA_PASSWORD / E2E_ADMIN_2FA_TOTP_SECRET
 *   E2E_SUPER_EMAIL / E2E_SUPER_PASSWORD / E2E_SUPER_TOTP_SECRET
 *   E2E_SUPER_B_EMAIL / E2E_SUPER_B_PASSWORD / E2E_SUPER_B_TOTP_SECRET
 *
 * Usage:
 *   npm run e2e:seed-auth
 */
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import argon2 from 'argon2';
import { PrismaClient, RoleCode, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env ${name}`);
  return value;
}

async function hashPassword(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

function encryptTotpSecret(plain) {
  const raw = process.env.TOTP_ENCRYPTION_KEY;
  const key =
    raw && raw.length >= 32
      ? crypto.createHash('sha256').update(raw).digest()
      : crypto.createHash('sha256').update('dev-totp-encryption-key-not-for-prod').digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

async function upsertUser(input) {
  const normalizedEmail = input.email.toLowerCase();
  const passwordHash = await hashPassword(input.password);
  const role = await prisma.role.findUniqueOrThrow({ where: { code: input.role } });

  const existing = await prisma.user.findUnique({ where: { normalizedEmail } });
  let userId;

  if (existing) {
    await prisma.credential.deleteMany({ where: { userId: existing.id } });
    await prisma.userRole.deleteMany({ where: { userId: existing.id } });
    await prisma.twoFactorMethod.deleteMany({ where: { userId: existing.id } });
    await prisma.session.deleteMany({ where: { userId: existing.id } });
    await prisma.sensitiveActionGrant.deleteMany({ where: { userId: existing.id } }).catch(() => undefined);
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        blockedUntil: null,
        suspendedAt: null,
        suspendedReason: null,
        credentials: { create: { passwordHash } },
        userRoles: { create: { roleId: role.id } },
        profile: {
          upsert: {
            create: { firstName: input.firstName, lastName: input.lastName },
            update: { firstName: input.firstName, lastName: input.lastName },
          },
        },
      },
    });
    userId = existing.id;
  } else {
    const created = await prisma.user.create({
      data: {
        email: input.email,
        normalizedEmail,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        credentials: { create: { passwordHash } },
        userRoles: { create: { roleId: role.id } },
        profile: { create: { firstName: input.firstName, lastName: input.lastName } },
        consentRecords: {
          create: [
            { kind: 'terms', granted: true, version: '1' },
            { kind: 'privacy', granted: true, version: '1' },
          ],
        },
      },
    });
    userId = created.id;
  }

  if (input.totpSecret) {
    await prisma.twoFactorMethod.create({
      data: {
        userId,
        type: 'TOTP',
        encryptedSecret: encryptTotpSecret(input.totpSecret),
        verifiedAt: new Date(),
      },
    });
  }

  return userId;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed E2E auth fixtures in production.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  execSync('npx prisma db seed', { stdio: 'inherit', env: process.env });

  const customerId = await upsertUser({
    email: required('E2E_CUSTOMER_EMAIL'),
    password: required('E2E_CUSTOMER_PASSWORD'),
    role: RoleCode.CUSTOMER,
    firstName: 'E2E',
    lastName: 'Customer',
  });

  const adminNo2faId = await upsertUser({
    email: required('E2E_ADMIN_EMAIL'),
    password: required('E2E_ADMIN_PASSWORD'),
    role: RoleCode.ADMIN,
    firstName: 'E2E',
    lastName: 'AdminNo2FA',
  });

  const admin2faId = await upsertUser({
    email: required('E2E_ADMIN_2FA_EMAIL'),
    password: required('E2E_ADMIN_2FA_PASSWORD'),
    role: RoleCode.ADMIN,
    firstName: 'E2E',
    lastName: 'Admin2FA',
    totpSecret: required('E2E_ADMIN_2FA_TOTP_SECRET'),
  });

  const superAId = await upsertUser({
    email: required('E2E_SUPER_EMAIL'),
    password: required('E2E_SUPER_PASSWORD'),
    role: RoleCode.SUPERADMIN,
    firstName: 'E2E',
    lastName: 'SuperA',
    totpSecret: required('E2E_SUPER_TOTP_SECRET'),
  });

  const superBId = await upsertUser({
    email: required('E2E_SUPER_B_EMAIL'),
    password: required('E2E_SUPER_B_PASSWORD'),
    role: RoleCode.SUPERADMIN,
    firstName: 'E2E',
    lastName: 'SuperB',
    totpSecret: required('E2E_SUPER_B_TOTP_SECRET'),
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        users: { customerId, adminNo2faId, admin2faId, superAId, superBId },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
