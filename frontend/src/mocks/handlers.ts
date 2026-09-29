/**
 * MSW (Mock Service Worker) — Request Handlers
 *
 * Interceptan las peticiones HTTP durante los tests y en desarrollo.
 * Replican el contrato real de ClinicaVeterinariaAPI para que los tests
 * no dependan de un servidor real corriendo.
 *
 * Estructura de respuestas idéntica a los DTOs del backend:
 *   - LoginResponseDto, MascotaResponseDto, PagedResultDto<T>
 */
import { http, HttpResponse } from 'msw';

// URL base que usa axiosClient (desde VITE_API_URL o default)
const API = 'http://localhost:5000';

// ─── Datos de prueba ──────────────────────────────────────────────────────────

// ─── Datos de prueba ──────────────────────────────────────────────────────────

export const MOCK_ADMIN_SESSION = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.token',
  tipo: 'Bearer',
  expiraEnMinutos: 60,
  nombreUsuario: 'admin_test',
  email: 'admin@test.com',
  rol: 'Admin',
};

export const MOCK_MASCOTAS = [
  { id: 1, nombre: 'Fido', especie: 'Perro', duenoId: 1, nombreDueno: 'Juan Test', emailDueno: 'juan@test.com' },
  { id: 2, nombre: 'Luna', especie: 'Gato',  duenoId: 1, nombreDueno: 'Juan Test', emailDueno: 'juan@test.com' },
];

export const MOCK_PAGED_MASCOTAS = {
  items: MOCK_MASCOTAS,
  totalCount: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const handlers = [
  // ── CORS preflight — jsdom + Axios disparan OPTIONS antes de GET/POST ──────
  // MSW debe responder a OPTIONS para que la petición real proceda en jsdom
  http.options(`${API}/*`, () => {
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }),

  // ── Auth: Login exitoso ────────────────────────────────────────────────────
  http.post(`${API}/api/v1/usuarios/login`, () => {
    return HttpResponse.json(MOCK_ADMIN_SESSION, { status: 200 });
  }),

  // ── Auth: Registro ────────────────────────────────────────────────────────
  http.post(`${API}/api/v1/usuarios/registro`, () => {
    return HttpResponse.json({
      ...MOCK_ADMIN_SESSION,
      nombreUsuario: 'nuevo_usuario',
      email: 'nuevo@test.com',
      rol: 'Cliente',
    }, { status: 201 });
  }),

  // ── Usuarios: Clientes lista ──────────────────────────────────────────────
  http.get(`${API}/api/v1/usuarios/clientes`, () => {
    return HttpResponse.json([
      { id: 1, nombre: 'Juan Test', email: 'juan@test.com' },
      { id: 2, nombre: 'Maria Test', email: 'maria@test.com' },
    ], { status: 200 });
  }),

  // ── Mascotas: GET paginado ─────────────────────────────────────────────────
  // El handler usa wildcard en la URL; MSW ignora query params por defecto
  http.get(`${API}/api/v1/mascotas`, () => {
    return HttpResponse.json(MOCK_PAGED_MASCOTAS, { status: 200 });
  }),

  // ── Mascotas: POST crear ──────────────────────────────────────────────────
  http.post(`${API}/api/v1/mascotas`, async ({ request }) => {
    const body = await request.json() as { nombre: string; especie: string };
    return HttpResponse.json(
      {
        id: 99,
        nombre: body.nombre,
        especie: body.especie,
        duenoId: 1,
        nombreDueno: 'admin_test',
        emailDueno: 'admin@test.com',
      },
      { status: 201 }
    );
  }),

  // ── Mascotas: PUT actualizar ──────────────────────────────────────────────
  http.put(`${API}/api/v1/mascotas/:id`, async ({ params, request }) => {
    const body = await request.json() as { nombre: string; especie: string };
    return HttpResponse.json(
      {
        id: Number(params.id),
        nombre: body.nombre,
        especie: body.especie,
        duenoId: 1,
        nombreDueno: 'admin_test',
        emailDueno: 'admin@test.com',
      },
      { status: 200 }
    );
  }),

  // ── Mascotas: DELETE ──────────────────────────────────────────────────────
  http.delete(`${API}/api/v1/mascotas/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];

// ─── Handlers de error — sobreescribir en tests individuales ─────────────────

/** Handler para simular credenciales incorrectas */
export const loginUnauthorizedHandler = http.post(
  `${API}/api/v1/usuarios/login`,
  () => HttpResponse.json({ mensaje: 'Credenciales incorrectas.' }, { status: 401 }),
);

/** Handler para simular error de validación 400 al crear mascota */
export const mascotaValidationErrorHandler = http.post(
  `${API}/api/v1/mascotas`,
  () => HttpResponse.json(
    {
      title: 'Validación fallida',
      status: 400,
      errors: { Nombre: ['El nombre debe tener al menos 2 caracteres.'] },
    },
    { status: 400 }
  ),
);

/** Handler para simular error de red (sin conexión) */
export const networkErrorHandler = http.post(
  `${API}/api/v1/usuarios/login`,
  () => HttpResponse.error(),
);
