#!/usr/bin/env node
/**
 * Inicia Next.js en desarrollo con CATALOG_REVIEW_MODE=1 (compatible Windows).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const env = {
  ...process.env,
  CATALOG_REVIEW_MODE: '1',
  NODE_ENV: 'development',
};

const nextCli = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextCli, 'dev'], {
  cwd: ROOT,
  env,
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
