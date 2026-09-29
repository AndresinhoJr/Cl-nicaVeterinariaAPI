import apiClient from '../api/axiosClient';
import { API_ROUTES } from '../api/apiRoutes';
import type {
  TratamientoResponse,
  TratamientoCreateRequest,
} from '../types/tratamiento.types';

/**
 * Obtiene todos los tratamientos médicos.
 * El backend filtra por dueño si el rol es "Cliente", o devuelve todos si es Admin/Veterinario.
 *
 * GET /api/v1/tratamientos
 * @throws {ApiError}
 */
export async function getTratamientos(): Promise<TratamientoResponse[]> {
  const response = await apiClient.get<TratamientoResponse[]>(
    API_ROUTES.tratamientos.base,
  );
  return response.data;
}

/**
 * Obtiene todos los tratamientos de una cita específica.
 * El backend verifica que el usuario tenga acceso a esa cita.
 *
 * GET /api/v1/tratamientos/cita/{citaId}
 * @throws {ApiError} 403 si no tiene permiso, 404 si la cita no existe
 */
export async function getTratamientosByCita(
  citaId: number,
): Promise<TratamientoResponse[]> {
  const response = await apiClient.get<TratamientoResponse[]>(
    API_ROUTES.tratamientos.byCita(citaId),
  );
  return response.data;
}

/**
 * Obtiene todos los tratamientos médicos de una mascota específica.
 * El backend verifica que el usuario tenga acceso a esa mascota.
 *
 * GET /api/v1/tratamientos/mascota/{mascotaId}
 * @throws {ApiError} 403 si no tiene permiso, 404 si la mascota no existe
 */
export async function getTratamientosByMascota(
  mascotaId: number,
): Promise<TratamientoResponse[]> {
  const response = await apiClient.get<TratamientoResponse[]>(
    API_ROUTES.tratamientos.byMascota(mascotaId),
  );
  return response.data;
}

/**
 * Crea un nuevo tratamiento médico en una cita.
 * ⚠️ Solo accesible para roles "Admin" y "Veterinario".
 *
 * POST /api/v1/tratamientos
 * @throws {ApiError} 403 si el rol es "Cliente", 400 si los datos son inválidos, 404 si la cita no existe
 */
export async function createTratamiento(
  data: TratamientoCreateRequest,
): Promise<TratamientoResponse> {
  const response = await apiClient.post<TratamientoResponse>(
    API_ROUTES.tratamientos.base,
    data,
  );
  return response.data;
}

/**
 * Elimina un tratamiento médico por su ID.
 * ⚠️ Solo accesible para roles "Admin" y "Veterinario".
 *
 * DELETE /api/v1/tratamientos/{id}
 * @throws {ApiError} 403 si el rol es "Cliente", 404 si no existe
 */
export async function deleteTratamiento(id: number): Promise<void> {
  await apiClient.delete(API_ROUTES.tratamientos.byId(id));
}
