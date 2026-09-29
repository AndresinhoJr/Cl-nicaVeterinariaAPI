/**
 * MSW Server — Configuración para tests con Node.js
 *
 * En tests (Node/jsdom): usa setupServer de msw/node
 * En browser (desarrollo): usaría setupWorker de msw/browser
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Servidor MSW para tests.
 * El setup global (src/test/setup.ts) lo arranca/apaga automáticamente.
 */
export const server = setupServer(...handlers);
