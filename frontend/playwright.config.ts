/**
 * playwright.config.ts
 *
 * Configuración E2E para ClinicaVeterinariaAPI frontend.
 * Corre contra el servidor de desarrollo de Vite (puerto 5173).
 * El backend real debe estar corriendo en localhost:5000.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Directorio de tests E2E
  testDir: './e2e',

  // Timeout por test (ms)
  timeout: 30_000,

  // Reintentos en CI, ninguno en local
  retries: process.env.CI ? 2 : 0,

  // Correr en paralelo en CI, secuencial en local
  workers: process.env.CI ? 2 : 1,

  // Reporter: legible en consola + HTML (en ./playwright-report)
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    // URL base del servidor de desarrollo
    baseURL: 'http://localhost:5173',

    // Capturar trazas al fallar (para depuración)
    trace: 'on-first-retry',

    // Screenshot automático al fallar
    screenshot: 'only-on-failure',

    // Video al fallar
    video: 'on-first-retry',
  },

  // ─── Proyectos: navegadores a testear ──────────────────────────────────────
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // ─── Web server: levantar Vite automáticamente antes de los tests ──────────
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
