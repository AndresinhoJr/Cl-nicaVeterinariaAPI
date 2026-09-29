import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ─── Configuración de Vitest ─────────────────────────────────────────────
  test: {
    // jsdom simula el DOM del browser en Node
    environment: 'jsdom',

    // Ejecutar setupTests antes de cada suite
    setupFiles: ['./src/test/setup.ts'],

    // Activar las matchers de jest-dom globalmente
    globals: true,

    // Variables de entorno disponibles en tests via import.meta.env
    // DEBEN definirse aquí para que estén listas antes de que cualquier
    // módulo (axiosClient) sea importado y evalúe import.meta.env.
    env: {
      VITE_API_URL: 'http://localhost:5000',
    },

    // Excluir tests E2E de Playwright (se ejecutan con 'npm run test:e2e')
    exclude: ['e2e/**', 'node_modules/**'],

    // Cobertura con v8 (sin instrumentación de Babel)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Solo medir cobertura de código de la app, no de tests/mocks
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/mocks/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      // Umbrales mínimos de cobertura
      thresholds: {
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },
  },
});
