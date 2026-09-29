// ─── Auth Types ───────────────────────────────────────────────────────────────
// Espeja: LoginRequestDto.cs, RegisterRequestDto.cs, LoginResponseDto.cs

/**
 * Cuerpo del POST /api/v1/usuarios/login
 * El backend acepta "Usuario" (puede ser email o nombre de usuario).
 */
export interface LoginRequest {
  usuario: string;
  password: string;
}

/**
 * Cuerpo del POST /api/v1/usuarios/registro
 */
export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

/**
 * Respuesta de login y registro exitosos.
 * Espeja: LoginResponseDto { Token, Tipo, ExpiraEnMinutos, NombreUsuario, Email, Rol }
 */
export interface LoginResponse {
  token: string;
  tipo: string;          // Siempre "Bearer"
  expiraEnMinutos: number;
  nombreUsuario: string;
  email: string;
  rol: string;           // "Admin" | "Veterinario" | "Cliente"
}

/**
 * Sesión de usuario almacenada localmente.
 * Se deriva de LoginResponse tras un login/registro exitoso.
 */
export interface AuthSession {
  token: string;
  nombreUsuario: string;
  email: string;
  rol: 'Admin' | 'Veterinario' | 'Cliente';
  expiresAt: number; // timestamp (Date.now() + expiraEnMinutos * 60_000)
}
