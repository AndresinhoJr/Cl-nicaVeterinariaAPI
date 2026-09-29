// ─── Mascota Types ────────────────────────────────────────────────────────────
// Espeja: MascotaCreateDto.cs, MascotaUpdateDto.cs, MascotaResponseDto.cs

/**
 * Especies válidas aceptadas por la API (lista en MascotaCreateDto.Validate).
 */
export const ESPECIES_VALIDAS = [
  'Perro',
  'Gato',
  'Ave',
  'Conejo',
  'Roedor',
  'Reptil',
  'Otro',
] as const;

export type EspecieValida = (typeof ESPECIES_VALIDAS)[number];

/**
 * Respuesta de la API para una mascota.
 * Espeja: MascotaResponseDto { Id, Nombre, Especie, DueñoId, NombreDueño, EmailDueño }
 */
export interface MascotaResponse {
  id: number;
  nombre: string;
  especie: string;
  duenoId: number;         // backend: DueñoId
  nombreDueno: string;     // backend: NombreDueño
  emailDueno: string;      // backend: EmailDueño
}

/**
 * Cuerpo del POST /api/v1/mascotas
 * Espeja: MascotaCreateDto { Nombre, Especie, DueñoId? }
 */
export interface MascotaCreateRequest {
  nombre: string;
  especie: EspecieValida;
  duenoId?: number;
}

/**
 * Cuerpo del PUT /api/v1/mascotas/{id}
 * Espeja: MascotaUpdateDto (mismos campos que Create, todos opcionales según el backend)
 */
export interface MascotaUpdateRequest {
  nombre?: string;
  especie?: EspecieValida;
  duenoId?: number;
}

/**
 * Query params para GET /api/v1/mascotas
 */
export interface MascotasQueryParams {
  page?: number;
  pageSize?: number;
  duenoId?: number;
  especie?: string;
}
