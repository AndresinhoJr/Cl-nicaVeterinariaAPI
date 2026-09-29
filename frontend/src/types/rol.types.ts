// ─── Rol Types ────────────────────────────────────────────────────────────────
// Espeja: Rol.cs del backend (Model)

/**
 * Rol de usuario devuelto por GET /api/v1/roles
 * Espeja el modelo Rol { Id, Nombre }
 */
export interface RolResponse {
  id: number;
  nombre: string;          // "Admin" | "Veterinario" | "Cliente"
}
