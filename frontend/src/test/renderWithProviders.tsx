/**
 * render personalizado que envuelve los componentes en los providers
 * necesarios para que funcionen en tests:
 * - BrowserRouter (para useNavigate, Link, NavLink)
 * - AuthProvider (para useAuth)
 *
 * Uso:
 *   renderWithProviders(<MiComponente />)
 *   renderWithProviders(<MiComponente />, { session: mockSession })
 */
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { saveSession } from '../services/auth.service';
import type { LoginResponse } from '../types/auth.types';
import { MOCK_ADMIN_SESSION } from '../mocks/handlers';

interface RenderConfig {
  /** Ruta inicial del router (default: '/') */
  initialEntries?: string[];
  /** Si se pasa, simula una sesión ya iniciada */
  preloadSession?: boolean;
  /** Rol de la sesión pre-cargada (default: Admin) */
  sessionRol?: 'Admin' | 'Veterinario' | 'Cliente';
}

/**
 * Simula una sesión guardada en sessionStorage antes de renderizar.
 * Necesario para tests que requieren usuario autenticado.
 */
export function seedSession(rol: 'Admin' | 'Veterinario' | 'Cliente' = 'Admin') {
  const mockResponse: LoginResponse = {
    ...MOCK_ADMIN_SESSION,
    rol,
    token: 'mock-jwt-token',
    tipo: 'Bearer',
    expiraEnMinutos: 60,
    nombreUsuario: `${rol.toLowerCase()}_test`,
    email: `${rol.toLowerCase()}@test.com`,
  };
  saveSession(mockResponse);
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    preloadSession = false,
    sessionRol = 'Admin',
  }: RenderConfig = {},
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  // Pre-cargar sesión si se requiere
  if (preloadSession) {
    seedSession(sessionRol);
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
