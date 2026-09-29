/**
 * Rutas centralizadas de la ClinicaVeterinariaAPI.
 * Usar siempre estas constantes en los servicios, nunca strings sueltos.
 */
export const API_ROUTES = {
  auth: {
    login: '/api/v1/usuarios/login',
    registro: '/api/v1/usuarios/registro',
    clientes: '/api/v1/usuarios/clientes',
    crearCliente: '/api/v1/usuarios/crear-cliente',
    crearVeterinario: '/api/v1/usuarios/crear-veterinario',
    cambiarPassword: '/api/v1/usuarios/cambiar-password',
    usuarios: '/api/v1/usuarios',
  },
  mascotas: {
    base: '/api/v1/mascotas',
    byId: (id: number) => `/api/v1/mascotas/${id}`,
  },
  citas: {
    base: '/api/v1/citas',
    byId: (id: number) => `/api/v1/citas/${id}`,
  },
  tratamientos: {
    base: '/api/v1/tratamientos',
    byCita: (citaId: number) => `/api/v1/tratamientos/cita/${citaId}`,
    byMascota: (mascotaId: number) => `/api/v1/tratamientos/mascota/${mascotaId}`,
    byId: (id: number) => `/api/v1/tratamientos/${id}`,
  },
  roles: {
    base: '/api/v1/roles',
    byId: (id: number) => `/api/v1/roles/${id}`,
  },
} as const;
