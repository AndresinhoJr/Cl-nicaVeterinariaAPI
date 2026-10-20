// src/test/setup.ts
// Ejecutado antes de cada suite de tests por Vitest.

// 1. Matchers de jest-dom (toBeInTheDocument, toHaveTextContent, etc.)
import '@testing-library/jest-dom';

// 2. Definir VITE_API_URL para que axiosClient use el mismo origen que MSW
//    import.meta.env.VITE_API_URL debe apuntar a la URL que MSW intercepta
import { beforeAll, afterEach, afterAll } from 'vitest';

Object.defineProperty(import.meta, 'env', {
  value: {
    ...import.meta.env,
    VITE_API_URL: 'http://localhost:5000',
  },
  writable: true,
});

// 3. Arrancar MSW server para interceptar peticiones HTTP durante los tests
import { server } from '../mocks/server';

// Levantar el servidor antes de todos los tests del archivo
// 'warn' en lugar de 'error' para que OPTIONS preflight no falle el setup
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Limpiar handlers adicionales añadidos en tests individuales
afterEach(() => server.resetHandlers());

// Apagar el servidor al terminar
afterAll(() => server.close());

// 4. Limpiar sessionStorage entre tests para aislar estado de sesión
afterEach(() => {
  sessionStorage.clear();
});
