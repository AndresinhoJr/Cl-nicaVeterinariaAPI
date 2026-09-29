import apiClient from '../api/axiosClient';
import { API_ROUTES } from '../api/apiRoutes';
import type { PagedResult } from '../types/common.types';
import type {
  MascotaResponse,
  MascotaCreateRequest,
  MascotaUpdateRequest,
  MascotasQueryParams,
} from '../types/mascota.types';

/**
 * Obtiene un listado paginado de mascotas.
 * Admite filtros por duenoId y especie.
 * El backend filtra automáticamente por propietario si el rol es "Cliente".
 *
 * GET /api/v1/mascotas
 * @throws {ApiError}
 */
export async function getMascotas(
  params: MascotasQueryParams = {},
): Promise<PagedResult<MascotaResponse>> {
  const response = await apiClient.get<PagedResult<MascotaResponse>>(
    API_ROUTES.mascotas.base,
    { params },
  );
  return response.data;
}

/**
 * Obtiene una mascota por su ID.
 * El backend verifica que el cliente solo acceda a sus propias mascotas.
 *
 * GET /api/v1/mascotas/{id}
 * @throws {ApiError} 404 si no existe, 403 si no tiene permiso
 */
export async function getMascotaById(id: number): Promise<MascotaResponse> {
  const response = await apiClient.get<MascotaResponse>(
    API_ROUTES.mascotas.byId(id),
  );
  return response.data;
}

/**
 * Crea una nueva mascota.
 * Si el rol es "Cliente", el backend asigna automáticamente el duenoId del token.
 *
 * POST /api/v1/mascotas
 * @throws {ApiError} 400 si los datos son inválidos
 */
export async function createMascota(
  data: MascotaCreateRequest,
): Promise<MascotaResponse> {
  const response = await apiClient.post<MascotaResponse>(
    API_ROUTES.mascotas.base,
    data,
  );
  return response.data;
}

/**
 * Actualiza una mascota existente.
 *
 * PUT /api/v1/mascotas/{id}
 * @throws {ApiError} 404 si no existe, 403 si no tiene permiso, 400 si datos inválidos
 */
export async function updateMascota(
  id: number,
  data: MascotaUpdateRequest,
): Promise<MascotaResponse> {
  const response = await apiClient.put<MascotaResponse>(
    API_ROUTES.mascotas.byId(id),
    data,
  );
  return response.data;
}

/**
 * Elimina una mascota.
 *
 * DELETE /api/v1/mascotas/{id}
 * @throws {ApiError} 404 si no existe, 403 si no tiene permiso
 */
export async function deleteMascota(id: number): Promise<void> {
  await apiClient.delete(API_ROUTES.mascotas.byId(id));
}
