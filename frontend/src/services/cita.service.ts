import apiClient from '../api/axiosClient';
import { API_ROUTES } from '../api/apiRoutes';
import type { PagedResult } from '../types/common.types';
import type {
  CitaResponse,
  CitaCreateRequest,
  CitaUpdateRequest,
  CitasQueryParams,
} from '../types/cita.types';

/**
 * Obtiene un listado paginado de citas médicas.
 * El backend filtra por propietario si el rol es "Cliente".
 *
 * GET /api/v1/citas
 * @throws {ApiError}
 */
export async function getCitas(
  params: CitasQueryParams = {},
): Promise<PagedResult<CitaResponse>> {
  const response = await apiClient.get<PagedResult<CitaResponse>>(
    API_ROUTES.citas.base,
    { params },
  );
  return response.data;
}

/**
 * Obtiene una cita médica por su ID.
 *
 * GET /api/v1/citas/{id}
 * @throws {ApiError} 404 si no existe, 403 si no tiene permiso
 */
export async function getCitaById(id: number): Promise<CitaResponse> {
  const response = await apiClient.get<CitaResponse>(
    API_ROUTES.citas.byId(id),
  );
  return response.data;
}

/**
 * Crea una nueva cita médica.
 * La fecha no puede ser anterior al momento actual.
 *
 * POST /api/v1/citas
 * @throws {ApiError} 400 si los datos son inválidos, 403 si no tiene permiso
 */
export async function createCita(
  data: CitaCreateRequest,
): Promise<CitaResponse> {
  const response = await apiClient.post<CitaResponse>(
    API_ROUTES.citas.base,
    data,
  );
  return response.data;
}

/**
 * Actualiza una cita médica existente.
 *
 * PUT /api/v1/citas/{id}
 * @throws {ApiError} 404 si no existe, 403 si no tiene permiso, 400 si datos inválidos
 */
export async function updateCita(
  id: number,
  data: CitaUpdateRequest,
): Promise<CitaResponse> {
  const response = await apiClient.put<CitaResponse>(
    API_ROUTES.citas.byId(id),
    data,
  );
  return response.data;
}

/**
 * Elimina una cita médica.
 *
 * DELETE /api/v1/citas/{id}
 * @throws {ApiError} 404 si no existe, 403 si no tiene permiso
 */
export async function deleteCita(id: number): Promise<void> {
  await apiClient.delete(API_ROUTES.citas.byId(id));
}
