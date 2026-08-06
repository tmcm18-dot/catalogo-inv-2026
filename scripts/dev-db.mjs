/**
 * Starts an embedded PostgreSQL for local Phase 1 development/tests.
 * Usage: node scripts/dev-db.mjs
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const databaseDir = path.join(root, '.pgdata');
const port = Number(process.env.PG_PORT || 54329);
const user = process.env.PG_USER || 'postgres';
const password = process.env.PG_PASSWORD || 'postgres';
const database = process.env.PG_DATABASE || 'catalogo_inv2026';

mkdirSync(databaseDir, { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir,
  user,
  password,
  port,
  persistent: true,
});

const url = `postgresql://${user}:${password}@127.0.0.1:${port}/${database}?schema=public`;

async function main() {
  try {
    await pg.initialise();
  } catch {
    // already initialized
  }
  await pg.start();
  try {
    await pg.createDatabase(database);
  } catch {
    // already exists
  }
  console.log('Embedded PostgreSQL running');
  console.log(`DATABASE_URL=${url}`);
  console.log('Keep this process open while developing.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
