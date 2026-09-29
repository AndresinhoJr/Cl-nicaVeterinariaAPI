// ─── Cita Types ───────────────────────────────────────────────────────────────
// Espeja: CitaCreateDto.cs, CitaUpdateDto.cs, CitaResponseDto.cs

/**
 * Respuesta de la API para una cita médica.
 * Espeja: CitaResponseDto {
 *   Id, MascotaId, NombreMascota, EspecieMascota,
 *   DueñoId, NombreDueño, Fecha, Motivo,
 *   TotalTratamientos, CostoTotalTratamientos
 * }
 */
export interface CitaResponse {
  id: number;
  mascotaId: number;
  nombreMascota: string;
  especieMascota: string;
  duenoId?: number;
  nombreDueno?: string;
  dueñoId?: number;
  nombreDueño?: string;
  fecha: string;           // ISO 8601 — usar new Date(fecha) para parsear
  motivo: string;
  totalTratamientos: number;
  costoTotalTratamientos: number;
}

/**
 * Cuerpo del POST /api/v1/citas
 * Espeja: CitaCreateDto { MascotaId, Fecha, Motivo }
 * Nota: Fecha debe ser ISO 8601 y NO anterior al momento actual.
 */
export interface CitaCreateRequest {
  mascotaId: number;
  fecha: string;           // ISO 8601 (ej. "2025-11-01T10:00:00")
  motivo: string;          // 5-255 caracteres
}

/**
 * Cuerpo del PUT /api/v1/citas/{id}
 * Espeja: CitaUpdateDto (campos opcionales)
 */
export interface CitaUpdateRequest {
  fecha?: string;
  motivo?: string;
}

/**
 * Query params para GET /api/v1/citas
 */
export interface CitasQueryParams {
  page?: number;
  pageSize?: number;
  duenoId?: number;
  mascotaId?: number;
}
