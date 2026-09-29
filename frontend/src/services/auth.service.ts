import apiClient from '../api/axiosClient';
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from '../api/axiosClient';
import { API_ROUTES } from '../api/apiRoutes';
import type { AuthSession, LoginRequest, LoginResponse, RegisterRequest } from '../types/auth.types';

// ─── Helpers de sesión ────────────────────────────────────────────────────────

const SESSION_KEY = 'clinica_auth_session';

/**
 * Guarda la sesión completa (token + metadata) en sessionStorage.
 * El token también se guarda en la clave separada para el interceptor de Axios.
 */
export function saveSession(response: LoginResponse): AuthSession {
  const session: AuthSession = {
    token: response.token,
    nombreUsuario: response.nombreUsuario,
    email: response.email,
    rol: response.rol as AuthSession['rol'],
    expiresAt: Date.now() + response.expiraEnMinutos * 60_000,
  };
  setStoredToken(response.token);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/**
 * Recupera la sesión guardada. Devuelve null si no existe o expiró.
 */
export function getSession(): AuthSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Limpia la sesión local completamente.
 */
export function clearSession(): void {
  removeStoredToken();
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Devuelve true si hay una sesión activa y no expirada.
 */
export function isAuthenticated(): boolean {
  return getSession() !== null && getStoredToken() !== null;
}

// ─── Servicios de Autenticación ───────────────────────────────────────────────

/**
 * Inicia sesión con usuario/email y contraseña.
 * Guarda automáticamente el token y la sesión en sessionStorage.
 *
 * @throws {ApiError} si las credenciales son incorrectas (401) o hay error de validación (400)
 */
export async function login(data: LoginRequest): Promise<AuthSession> {
  const response = await apiClient.post<LoginResponse>(
    API_ROUTES.auth.login,
    data,
  );
  return saveSession(response.data);
}

/**
 * Registra un nuevo usuario y lo autentica directamente.
 * Guarda automáticamente el token y la sesión en sessionStorage.
 *
 * @throws {ApiError} si el email ya existe (400) u otro error de validación
 */
export async function register(data: RegisterRequest): Promise<AuthSession> {
  const response = await apiClient.post<LoginResponse>(
    API_ROUTES.auth.registro,
    data,
  );
  return saveSession(response.data);
}

/**
 * Cierra la sesión localmente (no hay endpoint de logout en la API).
 */
export function logout(): void {
  clearSession();
}

export interface ClienteSummary {
  id: number;
  nombre: string;
  email: string;
}

export interface UsuarioSummary {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

/**
 * Obtiene la lista de clientes registrados (solo Admin y Veterinario).
 */
export async function getClientes(): Promise<ClienteSummary[]> {
  const response = await apiClient.get<ClienteSummary[]>(API_ROUTES.auth.clientes);
  return response.data;
}

/**
 * Inscribe un nuevo cliente en la clínica (Admin y Veterinario).
 */
export async function crearCliente(data: {
  nombre: string;
  email: string;
  password?: string;
}): Promise<ClienteSummary> {
  const response = await apiClient.post<ClienteSummary>(
    API_ROUTES.auth.crearCliente,
    data,
  );
  return response.data;
}

/**
 * Da de alta un nuevo veterinario (Solo Admin).
 */
export async function crearVeterinario(data: {
  nombre: string;
  email: string;
  password?: string;
}): Promise<UsuarioSummary> {
  const response = await apiClient.post<UsuarioSummary>(
    API_ROUTES.auth.crearVeterinario,
    data,
  );
  return response.data;
}

/**
 * Cambia la contraseña del usuario actualmente autenticado.
 */
export async function cambiarPassword(data: {
  passwordActual: string;
  nuevoPassword: string;
}): Promise<{ mensaje: string }> {
  const response = await apiClient.put<{ mensaje: string }>(
    API_ROUTES.auth.cambiarPassword,
    data,
  );
  return response.data;
}

/**
 * Obtiene el listado de todos los usuarios registrados (Solo Admin).
 */
export async function getUsuarios(): Promise<UsuarioSummary[]> {
  const response = await apiClient.get<UsuarioSummary[]>(API_ROUTES.auth.usuarios);
  return response.data;
}
