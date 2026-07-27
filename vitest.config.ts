import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Configuración de Vitest para el catálogo (Next.js 15 + React 19 + TS estricto).
// Las pruebas de esta baseline cubren lógica pura (carrito, WhatsApp, catálogo,
// navegación e integridad de hotspots), por lo que el entorno por defecto es Node.
// Si en el futuro se requiere DOM para algún caso concreto, puede fijarse
// `environment: 'jsdom'` por archivo con la directiva `// @vitest-environment jsdom`.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/lib/**/*.ts'],
    },
  },
});
