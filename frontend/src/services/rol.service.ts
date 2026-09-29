import apiClient from '../api/axiosClient';
import { API_ROUTES } from '../api/apiRoutes';
import type { RolResponse } from '../types/rol.types';

/**
 * Obtiene todos los roles disponibles en el sistema.
 *
 * GET /api/v1/roles
 * @throws {ApiError} 401 si no está autenticado
 */
export async function getRoles(): Promise<RolResponse[]> {
  const response = await apiClient.get<RolResponse[]>(API_ROUTES.roles.base);
  return response.data;
}

/**
 * Obtiene un rol por su ID.
 *
 * GET /api/v1/roles/{id}
 * @throws {ApiError} 401 si no está autenticado, 404 si no existe
 */
export async function getRolById(id: number): Promise<RolResponse> {
  const response = await apiClient.get<RolResponse>(
    API_ROUTES.roles.byId(id),
  );
  return response.data;
}
