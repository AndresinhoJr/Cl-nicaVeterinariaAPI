// ─── Paginación ───────────────────────────────────────────────────────────────

/**
 * Parámetros de paginación aceptados por los endpoints /mascotas y /citas.
 * Espeja: PaginationParamsDto.cs (page ≥ 1, pageSize 1-50)
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Respuesta paginada genérica.
 * Espeja: PagedResultDto<T>.cs
 */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
