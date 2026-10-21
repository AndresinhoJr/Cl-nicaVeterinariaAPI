/**
 * TEST 1: LoginPage
 *
 * Estrategia: vi.mock() de AuthContext para aislar el componente de Axios.
 * Esto evita todos los problemas del adaptador HTTP en jsdom.
 *
 * Cubre:
 * ✓ Renderizado del formulario y sus campos
 * ✓ Validación client-side (campo vacío, contraseña corta)
 * ✓ Login exitoso → login() es llamado con las credenciales correctas
 * ✓ Error 401 → mensaje "Credenciales incorrectas" visible
 * ✓ Error de red (status 0) → mensaje de conexión
 */
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import LoginPage from '../../pages/LoginPage';
import { renderWithProviders } from '../renderWithProviders';
import type { ApiError } from '../../api/axiosClient';

// ─── Mock de AuthContext ──────────────────────────────────────────────────────
vi.mock('../../context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../context/AuthContext')>();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

import { useAuth } from '../../context/AuthContext';

// Helper para construir ApiError tipado
const makeApiError = (status: number, message: string): ApiError => ({ status, message });

// Estado por defecto del mock (login exitoso vacío)
const defaultAuthMock = () => ({
  user: null,
  token: null,
  loading: false,
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  hasRole: vi.fn().mockReturnValue(false),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(defaultAuthMock());
  });

  const setup = () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    return { user };
  };

  // ─── Renderizado ──────────────────────────────────────────────────────────

  it('renderiza el título y los campos del formulario', () => {
    setup();
    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/usuario o correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('muestra la nota informativa sobre la gestión de accesos y almacenamiento seguro', () => {
    setup();
    expect(screen.getByText(/Los accesos de clientes son gestionados en recepción/i)).toBeInTheDocument();
    expect(screen.getByRole('note')).toBeInTheDocument();
  });

  // ─── Validación client-side (Zod) ─────────────────────────────────────────

  it('muestra error de validación si se envía el formulario vacío', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/el correo o usuario es obligatorio/i)).toBeInTheDocument();
    });
  });

  it('muestra error si la contraseña tiene menos de 6 caracteres', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/usuario o correo/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), '123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument();
    });
  });

  // ─── Login exitoso ─────────────────────────────────────────────────────────

  it('llama a login() con las credenciales ingresadas', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({ ...defaultAuthMock(), login: mockLogin });

    const { user } = setup();
    await user.type(screen.getByLabelText(/usuario o correo/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        usuario: 'admin@test.com',
        password: 'password123',
      });
    });
  });

  // ─── Error 401 ────────────────────────────────────────────────────────────

  it('muestra alerta de credenciales incorrectas si login lanza ApiError 401', async () => {
    const mockLogin = vi.fn().mockRejectedValue(makeApiError(401, 'Credenciales incorrectas.'));
    vi.mocked(useAuth).mockReturnValue({ ...defaultAuthMock(), login: mockLogin });

    const { user } = setup();
    await user.type(screen.getByLabelText(/usuario o correo/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // ─── Error de red ─────────────────────────────────────────────────────────

  it('muestra mensaje de conexión si login lanza ApiError con status 0', async () => {
    const mockLogin = vi.fn().mockRejectedValue(
      makeApiError(0, 'No se pudo conectar con el servidor. Verifica tu conexión.')
    );
    vi.mocked(useAuth).mockReturnValue({ ...defaultAuthMock(), login: mockLogin });

    const { user } = setup();
    await user.type(screen.getByLabelText(/usuario o correo/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/sin conexión con el servidor/i)).toBeInTheDocument();
    });
  });

  // ─── Error 429 Rate Limiting ──────────────────────────────────────────────

  it('muestra mensaje de rate limiting si login lanza ApiError con status 429', async () => {
    const mockLogin = vi.fn().mockRejectedValue(
      makeApiError(429, 'Has superado el límite de intentos permitidos.')
    );
    vi.mocked(useAuth).mockReturnValue({ ...defaultAuthMock(), login: mockLogin });

    const { user } = setup();
    await user.type(screen.getByLabelText(/usuario o correo/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(screen.getByText(/demasiados intentos fallidos/i)).toBeInTheDocument();
    });
  });
});
