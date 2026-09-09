import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '');
if (!baseURL) {
  throw new Error(
    'PLAYWRIGHT_BASE_URL es obligatorio. Usá un Vercel Preview o http://127.0.0.1:3000 para auth local (nunca Production).',
  );
}

const productionHosts = new Set([
  'catalogo-inv-2026.vercel.app',
  'catalogo-inv-2026-maxi20.vercel.app',
]);

const host = new URL(baseURL).hostname;
if (productionHosts.has(host) || host.includes('-git-main-')) {
  throw new Error(
    `PLAYWRIGHT_BASE_URL apunta a Production/main (${baseURL}). Nivel 1 solo corre contra Preview.`,
  );
}

const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
const extraHTTPHeaders: Record<string, string> = {};
if (bypass) {
  extraHTTPHeaders['x-vercel-protection-bypass'] = bypass;
  extraHTTPHeaders['x-vercel-set-bypass-cookie'] = 'true';
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL,
    extraHTTPHeaders,
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
    locale: 'es-AR',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
