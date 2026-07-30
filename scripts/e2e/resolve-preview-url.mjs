#!/usr/bin/env node
/**
 * Resuelve y valida una URL de Vercel Preview para E2E Nivel 1.
 * Nunca acepta Production / main.
 *
 * Entradas (prioridad):
 * 1. PLAYWRIGHT_BASE_URL | INPUT_PREVIEW_URL | PREVIEW_URL
 * 2. Deployments/statuses de GitHub para el SHA (gh + GITHUB_TOKEN)
 *
 * Escribe preview_url en $GITHUB_OUTPUT cuando corre en Actions.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const PRODUCTION_HOSTS = new Set([
  'catalogo-inv-2026.vercel.app',
  'catalogo-inv-2026-maxi20.vercel.app',
]);

function fail(message) {
  console.error(`[resolve-preview-url] ${message}`);
  process.exit(1);
}

function parsePreviewUrl(raw) {
  let url;
  try {
    url = new URL(String(raw).trim());
  } catch {
    throw new Error(`URL inválida: ${raw}`);
  }
  if (url.protocol !== 'https:') throw new Error(`Solo HTTPS: ${url.href}`);
  const host = url.hostname;
  if (PRODUCTION_HOSTS.has(host) || host.includes('-git-main-')) {
    throw new Error(`URL de Production/main rechazada: ${url.href}`);
  }
  if (!host.endsWith('.vercel.app')) {
    throw new Error(`Se espera un host *.vercel.app de Preview: ${url.href}`);
  }
  return url.origin;
}

function assertPreviewUrl(raw) {
  try {
    return parsePreviewUrl(raw);
  } catch (err) {
    fail(err.message ?? String(err));
  }
}

function writeOutput(url) {
  const safe = assertPreviewUrl(url);
  console.log(`[resolve-preview-url] Preview OK: ${safe}`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `preview_url=${safe}\n`);
  }
  process.stdout.write(`${safe}\n`);
  return safe;
}

function ghJson(args) {
  const out = execFileSync('gh', args, {
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function collectPreviewCandidates(owner, repo, sha) {
  const urls = [];
  const statuses = ghJson([
    'api',
    `repos/${owner}/${repo}/commits/${sha}/statuses?per_page=100`,
  ]);
  for (const s of Array.isArray(statuses) ? statuses : []) {
    if (
      s.state === 'success' &&
      typeof s.target_url === 'string' &&
      /vercel/i.test(`${s.context ?? ''} ${s.target_url}`)
    ) {
      urls.push(s.target_url);
    }
  }

  const deployments = ghJson([
    'api',
    `repos/${owner}/${repo}/deployments?sha=${encodeURIComponent(sha)}&per_page=20`,
  ]);
  for (const d of Array.isArray(deployments) ? deployments : []) {
    if (/production/i.test(String(d.environment ?? ''))) continue;
    const depStatuses = ghJson([
      'api',
      `repos/${owner}/${repo}/deployments/${d.id}/statuses?per_page=10`,
    ]);
    for (const st of Array.isArray(depStatuses) ? depStatuses : []) {
      if (st.state !== 'success') continue;
      if (st.environment_url) urls.push(st.environment_url);
      if (st.target_url) urls.push(st.target_url);
    }
  }

  return [...new Set(urls)].filter((u) => {
    try {
      parsePreviewUrl(u);
      return true;
    } catch {
      return false;
    }
  });
}

function resolveFromGitHub(owner, repo, sha, timeoutMs, pollMs) {
  const deadline = Date.now() + timeoutMs;
  let lastNote = '';
  while (Date.now() < deadline) {
    try {
      const candidates = collectPreviewCandidates(owner, repo, sha);
      if (candidates.length > 0) return candidates[0];
      lastNote = 'sin Preview READY aún';
    } catch (err) {
      lastNote = `error consultando GitHub: ${err.message ?? err}`;
    }
    console.log(`[resolve-preview-url] ${lastNote}; reintento en ${pollMs}ms`);
    sleep(pollMs);
  }
  fail(`Timeout esperando Preview para ${sha}. ${lastNote}`);
}

function main() {
  const direct = (
    process.env.PLAYWRIGHT_BASE_URL ||
    process.env.INPUT_PREVIEW_URL ||
    process.env.PREVIEW_URL ||
    ''
  ).trim();
  if (direct) {
    writeOutput(direct);
    return;
  }

  const repository = process.env.GITHUB_REPOSITORY;
  const sha = process.env.PR_HEAD_SHA || process.env.GITHUB_SHA || '';
  if (!repository || !sha) {
    fail(
      'Sin PLAYWRIGHT_BASE_URL/INPUT_PREVIEW_URL y sin GITHUB_REPOSITORY+SHA para resolver Preview.',
    );
  }

  const [owner, repo] = repository.split('/');
  const timeoutMs = Number(process.env.PREVIEW_WAIT_TIMEOUT_MS || 10 * 60 * 1000);
  const pollMs = Number(process.env.PREVIEW_WAIT_POLL_MS || 15_000);
  writeOutput(resolveFromGitHub(owner, repo, sha, timeoutMs, pollMs));
}

main();
