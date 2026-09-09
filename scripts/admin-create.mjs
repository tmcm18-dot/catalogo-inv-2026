/**
 * Interactive bootstrap for a SUPERADMIN (no fixed password in the repo).
 * Usage: npm run admin:create
 * Requires: DATABASE_URL, roles seeded (npm run db:seed).
 */
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isPasswordLengthValid(password) {
  return password.length >= 10 && password.length <= 128;
}

async function hashPassword(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }

  const rl = createInterface({ input, output });

  try {
    const emailRaw = await rl.question('Email del SUPERADMIN: ');
    const email = emailRaw.trim();
    if (!email.includes('@') || email.length < 5) {
      throw new Error('Email inválido.');
    }

    const firstName = (await rl.question('Nombre: ')).trim() || 'Super';
    const lastName = (await rl.question('Apellido: ')).trim() || 'Admin';

    output.write('Contraseña (mín. 10 caracteres, no se muestra): ');
    const password = await readHiddenLine();
    output.write('\nConfirmá la contraseña: ');
    const confirm = await readHiddenLine();
    output.write('\n');

    if (password !== confirm) {
      throw new Error('Las contraseñas no coinciden.');
    }
    if (!isPasswordLengthValid(password)) {
      throw new Error('La contraseña debe tener entre 10 y 128 caracteres.');
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await prisma.user.findUnique({ where: { normalizedEmail } });
    if (existing) {
      throw new Error('Ya existe un usuario con ese correo.');
    }

    const superRole = await prisma.role.findUnique({ where: { code: 'SUPERADMIN' } });
    if (!superRole) {
      throw new Error('Rol SUPERADMIN ausente. Ejecutá npm run db:seed primero.');
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        normalizedEmail,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        profile: {
          create: { firstName, lastName },
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

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'admin.create_bootstrap',
        resourceType: 'user',
        resourceId: user.id,
        metadata: { via: 'admin:create' },
      },
    });

    console.log(`SUPERADMIN creado: ${email}`);
    console.log('Obligatorio: configurar TOTP en /admin/seguridad antes de operar.');
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

/** Minimal hidden input for local CLI (Windows-compatible best-effort). */
async function readHiddenLine() {
  return new Promise((resolve, reject) => {
    const wasRaw = input.isRaw;
    const chunks = [];

    const onData = (buf) => {
      const str = buf.toString('utf8');
      for (const ch of str) {
        if (ch === '\n' || ch === '\r') {
          cleanup();
          resolve(chunks.join(''));
          return;
        }
        if (ch === '\u0003') {
          cleanup();
          reject(new Error('Cancelado'));
          return;
        }
        if (ch === '\u0008' || ch === '\u007f') {
          chunks.pop();
          continue;
        }
        chunks.push(ch);
      }
    };

    function cleanup() {
      input.off('data', onData);
      if (typeof input.setRawMode === 'function') {
        input.setRawMode(Boolean(wasRaw));
      }
      input.pause();
    }

    if (typeof input.setRawMode === 'function') {
      input.setRawMode(true);
    }
    input.resume();
    input.on('data', onData);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
