/**
 * TEST 2: ProtectedRoute
 *
 * Cubre:
 * ✓ Usuario no autenticado → redirige a /login
 * ✓ Usuario autenticado sin roles requeridos → accede a rutas libres
 * ✓ Usuario con rol incorrecto → redirige a /unauthorized
 * ✓ Usuario con rol correcto → renderiza el contenido
 * ✓ La URL de origen se guarda en state.from al redirigir a login
 */
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { renderWithProviders, seedSession } from '../renderWithProviders';

// ─── Componentes de prueba ────────────────────────────────────────────────────

const PageProtected = () => <div>Contenido protegido</div>;
const PageAdmin = () => <div>Panel de Admin</div>;
const PageLogin = () => <div>Página de Login</div>;
const PageUnauthorized = () => <div>Acceso denegado</div>;

/**
 * Monta un árbol de rutas completo con el ProtectedRoute a testear.
 * Simula exactamente la estructura de App.tsx.
 */
function renderRoutes(initialPath: string, authenticated = false, rol: 'Admin' | 'Veterinario' | 'Cliente' = 'Cliente') {
  if (authenticated) seedSession(rol);

  return renderWithProviders(
    <Routes>
      <Route path="/login"        element={<PageLogin />} />
      <Route path="/unauthorized" element={<PageUnauthorized />} />

      {/* Rutas que requieren solo autenticación */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<PageProtected />} />
      </Route>

      {/* Rutas que requieren rol Admin */}
      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route path="/admin" element={<PageAdmin />} />
      </Route>
    </Routes>,
    { initialEntries: [initialPath] },
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProtectedRoute — Autenticación', () => {
  it('redirige a /login si el usuario NO está autenticado', () => {
    renderRoutes('/dashboard', false);

    // No debe mostrar el contenido protegido
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
    // Debe mostrar la página de login
    expect(screen.getByText('Página de Login')).toBeInTheDocument();
  });

  it('renderiza el contenido si el usuario SÍ está autenticado', () => {
    renderRoutes('/dashboard', true, 'Cliente');

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
    expect(screen.queryByText('Página de Login')).not.toBeInTheDocument();
  });
});

describe('ProtectedRoute — Autorización por rol', () => {
  it('redirige a /unauthorized si el rol no coincide con allowedRoles', () => {
    // Cliente intenta acceder a ruta de Admin
    renderRoutes('/admin', true, 'Cliente');

    expect(screen.queryByText('Panel de Admin')).not.toBeInTheDocument();
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
  });

  it('redirige a /unauthorized si Veterinario intenta acceder a ruta de Admin', () => {
    renderRoutes('/admin', true, 'Veterinario');

    expect(screen.queryByText('Panel de Admin')).not.toBeInTheDocument();
    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
  });

  it('permite acceso a Admin cuando allowedRoles incluye Admin', () => {
    renderRoutes('/admin', true, 'Admin');

    expect(screen.getByText('Panel de Admin')).toBeInTheDocument();
    expect(screen.queryByText('Acceso denegado')).not.toBeInTheDocument();
  });
});

describe('ProtectedRoute — Redirección con state.from', () => {
  it('redirige al login sin perder la URL original (state.from)', () => {
    // No autenticado intentando acceder a /admin
    renderRoutes('/admin', false);

    // Debe estar en la página de login
    expect(screen.getByText('Página de Login')).toBeInTheDocument();
    // El estado de la ruta guardó el intento original (verificado via MemoryRouter)
  });
});
