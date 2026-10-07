import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { AuthSession } from '../types/auth.types';

interface ProtectedRouteProps {
  /**
   * Lista de roles que pueden acceder a esta ruta.
   * Si se omite, cualquier usuario autenticado puede acceder.
   * Si se provee y el usuario no tiene el rol → redirige a /unauthorized (403).
   */
  allowedRoles?: AuthSession['rol'][];
}

/**
 * Guard de rutas en dos niveles:
 *
 * 1. Autenticación: si no hay sesión activa → redirige a /login.
 *    Guarda la ruta actual en `state.from` para poder volver después del login.
 *
 * 2. Autorización (opcional): si se pasan `allowedRoles` y el usuario
 *    no tiene ninguno de ellos → redirige a /unauthorized (403).
 *
 * Uso:
 *   <Route element={<ProtectedRoute />}>                   // solo auth
 *     <Route path="/mascotas" element={<MascotaList />} />
 *   </Route>
 *
 *   <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>  // auth + rol
 *     <Route path="/admin" element={<AdminPage />} />
 *   </Route>
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  // ── Nivel 1: Autenticación ─────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}   // para redirigir de vuelta tras login
        replace
      />
    );
  }

  // ── Nivel 2: Autorización por rol ─────────────────────────────────────────
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ── Acceso concedido → renderizar la ruta hija ─────────────────────────────
  return <Outlet />;
}
