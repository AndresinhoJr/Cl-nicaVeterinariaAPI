import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// ─── Clave del token en sessionStorage ────────────────────────────────────────
// Se usa sessionStorage: el token se borra automáticamente al cerrar el tab,
// lo que mejora la seguridad en un entorno académico sin backend de refresh.
export const TOKEN_KEY = 'clinica_auth_token';

export const getStoredToken = (): string | null =>
  sessionStorage.getItem(TOKEN_KEY);

export const setStoredToken = (token: string): void =>
  sessionStorage.setItem(TOKEN_KEY, token);

export const removeStoredToken = (): void =>
  sessionStorage.removeItem(TOKEN_KEY);

// ─── Instancia centralizada de Axios ──────────────────────────────────────────
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000, // 15 segundos
});

// ─── Request Interceptor: adjunta JWT automáticamente ────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor: normaliza errores HTTP ────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido → limpiar token del storage
      removeStoredToken();
      // Disparar evento custom para que AuthContext (dentro del árbol React)
      // limpie el estado global y navegue via useNavigate(), sin hard-redirect.
      // Esto preserva la navegación SPA y evita recargar la página.
      if (!window.location.pathname.includes('/login')) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    // Normalizar el error para que todos los servicios reciban un ApiError tipado
    const apiError = normalizeError(error);
    return Promise.reject(apiError);
  },
);

/**
 * Convierte un AxiosError en un ApiError tipado y legible.
 */
function normalizeError(error: AxiosError): ApiError {
  if (error.response) {
    // El servidor respondió con un código de error (4xx, 5xx)
    const data = error.response.data as Record<string, unknown>;
    const fieldErrors = data?.errors as Record<string, string[]> | undefined;

    let msg =
      (data?.detail as string) ||
      (data?.mensaje as string) ||
      (data?.title as string);

    // Traducir mensajes estándar de ASP.NET Core a español claro
    if (!msg || msg.toLowerCase().includes('validation errors occurred') || msg.toLowerCase().includes('one or more')) {
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        const firstKey = Object.keys(fieldErrors)[0];
        msg = fieldErrors[firstKey]?.[0] || 'Por favor revisa los campos señalados en el formulario.';
      } else {
        msg = 'Ocurrieron errores de validación. Por favor revisa los datos ingresados.';
      }
    } else if (error.response.status === 401 && (!msg || msg.toLowerCase().includes('unauthorized'))) {
      msg = 'Credenciales incorrectas o sesión expirada.';
    } else if (error.response.status === 403 && (!msg || msg.toLowerCase().includes('forbidden'))) {
      msg = 'No tienes permisos suficientes para realizar esta acción.';
    } else if (error.response.status === 404 && (!msg || msg.toLowerCase().includes('not found'))) {
      msg = 'El recurso solicitado no fue encontrado.';
    } else if (error.response.status === 429) {
      msg = 'Has superado el límite de peticiones permitidas. Espera un momento.';
    }

    return {
      status: error.response.status,
      message: msg || `Error ${error.response.status}`,
      errors: fieldErrors,
    };
  }

  if (error.request) {
    // La solicitud se envió pero no hubo respuesta (sin conexión, CORS, timeout)
    return {
      status: 0,
      message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
    };
  }

  // Error al construir la solicitud
  return {
    status: -1,
    message: error.message || 'Ocurrió un error inesperado.',
  };
}

/**
 * Error tipado que devuelven todos los servicios ante un fallo HTTP.
 * Se puede importar en los componentes para discriminar el tipo de error.
 */
export interface ApiError {
  status: number;
  message: string;
  /** Errores de validación por campo (ej. { "Nombre": ["El nombre es obligatorio."] }) */
  errors?: Record<string, string[]>;
}

/**
 * Type guard: determina si un valor capturado en catch es un ApiError.
 * Uso: `if (isApiError(e)) { ... }`
 */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'message' in value
  );
}

export default apiClient;
