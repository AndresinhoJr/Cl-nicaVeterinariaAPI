// ─── Tratamiento Types ────────────────────────────────────────────────────────
// Espeja: TratamientoCreateDto.cs, TratamientoResponseDto.cs

/**
 * Respuesta de la API para un tratamiento médico.
 * Espeja: TratamientoResponseDto {
 *   Id, CitaId, Descripcion, Costo, FechaCita, NombreMascota
 * }
 */
export interface TratamientoResponse {
  id: number;
  citaId: number;
  mascotaId?: number;
  descripcion: string;
  costo: number;
  fechaCita: string;       // ISO 8601
  nombreMascota: string;
}

/**
 * Cuerpo del POST /api/v1/tratamientos
 * Solo accesible para roles Admin y Veterinario.
 * Espeja: TratamientoCreateDto { CitaId, Descripcion, Costo }
 */
export interface TratamientoCreateRequest {
  citaId: number;
  descripcion: string;     // 5-255 caracteres
  costo: number;           // > 0
}
