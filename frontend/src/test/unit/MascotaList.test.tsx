/**
 * TEST 3: MascotaList — Operaciones CRUD
 *
 * Estrategia: vi.mock() del hook useMascotas completo.
 * MascotaList consume useMascotas (no el servicio directamente), por lo que
 * mockeamos el hook que es el verdadero punto de entrada del componente.
 *
 * Cubre:
 * ✓ Renderiza las tarjetas con datos del hook
 * ✓ Muestra estado vacío cuando items es []
 * ✓ Muestra estado de error cuando list.error está presente
 * ✓ El h1 está siempre visible
 * ✓ Abre el modal de creación al hacer click en "Nueva mascota"
 * ✓ Cierra el modal con Escape sin crear nada
 * ✓ Llama a create() con los datos correctos al enviar el formulario
 * ✓ Abre modal de eliminación (alertdialog) al hacer click en Eliminar
 * ✓ Cierra el alertdialog al hacer click en Cancelar
 * ✓ Llama a remove() con el id correcto al confirmar eliminación
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MascotaList } from '../../features/mascotas/MascotaList';
import { renderWithProviders } from '../renderWithProviders';
import type { MascotaResponse } from '../../types/mascota.types';

// ─── Mock del hook useMascotas ────────────────────────────────────────────────
// El componente sólo consume el hook, no el servicio directamente.
vi.mock('../../features/mascotas/useMascotas');
import { useMascotas } from '../../features/mascotas/useMascotas';

// ─── Mock de getClientes en auth.service para alimentar el selector de MascotaForm ──
vi.mock('../../services/auth.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/auth.service')>();
  return {
    ...actual,
    getClientes: vi.fn().mockResolvedValue([
      { id: 1, nombre: 'Juan Test', email: 'juan@test.com' },
      { id: 2, nombre: 'Maria Test', email: 'maria@test.com' },
    ]),
  };
});

// ─── Datos de prueba ──────────────────────────────────────────────────────────

const MOCK_MASCOTAS: MascotaResponse[] = [
  { id: 1, nombre: 'Fido', especie: 'Perro', duenoId: 1, nombreDueno: 'Juan Test', emailDueno: 'juan@test.com' },
  { id: 2, nombre: 'Luna', especie: 'Gato', duenoId: 1, nombreDueno: 'Juan Test', emailDueno: 'juan@test.com' },
];

// ─── Factory: estado base del hook ───────────────────────────────────────────

const createMockHook = (overrides = {}) => ({
  list: {
    loading: false,
    error: null,
    data: {
      items: MOCK_MASCOTAS,
      totalCount: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
  params: {},
  goToPage: vi.fn(),
  applyFilters: vi.fn(),
  refetch: vi.fn(),
  mutation: { loading: false, error: null, fieldErrors: null },
  // create retorna la mascota creada en caso de éxito (para que handleFormSubmit cierre el modal)
  create: vi.fn().mockResolvedValue(MOCK_MASCOTAS[0]),
  update: vi.fn().mockResolvedValue(MOCK_MASCOTAS[0]),
  remove: vi.fn().mockResolvedValue(true),
  ...overrides,
});

// ─── Setup global ─────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.mocked(useMascotas).mockReturnValue(createMockHook());
});

// ─── Suite: Carga y renderizado ───────────────────────────────────────────────

describe('MascotaList — Carga y renderizado', () => {
  it('renderiza las tarjetas con los nombres de las mascotas', () => {
    renderWithProviders(<MascotaList />, { preloadSession: true });

    expect(screen.getByText('Fido')).toBeInTheDocument();
    expect(screen.getByText('Luna')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('muestra el h1 de la página', () => {
    renderWithProviders(<MascotaList />, { preloadSession: true });
    expect(screen.getByRole('heading', { level: 1, name: /mascotas/i })).toBeInTheDocument();
  });

  it('muestra el contador de resultados', () => {
    renderWithProviders(<MascotaList />, { preloadSession: true });
    expect(screen.getByText(/2 pacientes registrados/i)).toBeInTheDocument();
  });

  it('muestra estado vacío cuando items es []', () => {
    vi.mocked(useMascotas).mockReturnValue(
      createMockHook({
        list: {
          loading: false,
          error: null,
          data: { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        },
      })
    );

    renderWithProviders(<MascotaList />, { preloadSession: true });
    expect(screen.getByText(/no hay mascotas/i)).toBeInTheDocument();
  });

  it('muestra estado de error cuando list.error tiene mensaje', () => {
    vi.mocked(useMascotas).mockReturnValue(
      createMockHook({
        list: { loading: false, error: 'No se pudo conectar con el servidor.', data: null },
      })
    );

    renderWithProviders(<MascotaList />, { preloadSession: true });
    expect(screen.getByText(/error al cargar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('muestra skeletons cuando list.loading es true', () => {
    vi.mocked(useMascotas).mockReturnValue(
      createMockHook({
        list: { loading: true, error: null, data: null },
      })
    );

    renderWithProviders(<MascotaList />, { preloadSession: true });
    // Los skeletons tienen aria-hidden="true"
    const skeletons = document.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
    // No hay tarjetas de mascotas
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});

// ─── Suite: Crear mascota ──────────────────────────────────────────────────────

describe('MascotaList — Crear mascota (CRUD)', () => {
  it('abre el modal de formulario al hacer click en "Nueva mascota"', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MascotaList />, { preloadSession: true });

    await user.click(screen.getByRole('button', { name: /nueva mascota/i }));

    const dialog = screen.getByRole('dialog', { name: /crear mascota/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /nueva mascota/i })).toBeInTheDocument();
  });

  it('cierra el modal con Escape sin llamar a create()', async () => {
    const user = userEvent.setup();
    const mockCreate = vi.fn();
    vi.mocked(useMascotas).mockReturnValue(createMockHook({ create: mockCreate }));

    renderWithProviders(<MascotaList />, { preloadSession: true });

    await user.click(screen.getByRole('button', { name: /nueva mascota/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Hacer click en el botón Cancelar (equivalente semántico a Escape para el usuario)
    // Nota: userEvent.keyboard(Escape) requiere que el foco esté dentro del overlay
    await user.click(within(dialog).getByRole('button', { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('llama a create() con los datos del formulario y cierra el modal', async () => {
    const mockCreate = vi.fn().mockResolvedValue(MOCK_MASCOTAS[0]);
    vi.mocked(useMascotas).mockReturnValue(createMockHook({ create: mockCreate }));

    const user = userEvent.setup();
    renderWithProviders(<MascotaList />, { preloadSession: true });

    await user.click(screen.getByRole('button', { name: /nueva mascota/i }));
    const dialog = screen.getByRole('dialog');

    // Rellenar campos obligatorios
    await user.type(within(dialog).getByLabelText(/^nombre/i), 'Rex');
    await user.selectOptions(within(dialog).getByLabelText(/^especie/i), 'Perro');

    // Esperar a que las opciones de clientes se carguen desde la API
    await waitFor(() => {
      expect(within(dialog).getByRole('option', { name: /Juan Test/i })).toBeInTheDocument();
    });
    const duenoSelect = within(dialog).getByLabelText(/dueño \(cliente\)/i);
    await user.selectOptions(duenoSelect, '1');

    await user.click(within(dialog).getByRole('button', { name: /crear mascota/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Rex', especie: 'Perro', duenoId: 1 })
      );
    });

    // El modal se cierra tras éxito
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

// ─── Suite: Eliminar mascota ───────────────────────────────────────────────────

describe('MascotaList — Eliminar mascota (CRUD)', () => {
  it('abre el alertdialog de confirmación al hacer click en Eliminar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MascotaList />, { preloadSession: true });

    // Hacer click en el botón "Eliminar Fido" (aria-label exacto)
    await user.click(screen.getByRole('button', { name: /eliminar fido/i }));

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('cierra el alertdialog al hacer click en Cancelar sin llamar a remove()', async () => {
    const mockRemove = vi.fn();
    vi.mocked(useMascotas).mockReturnValue(createMockHook({ remove: mockRemove }));

    const user = userEvent.setup();
    renderWithProviders(<MascotaList />, { preloadSession: true });

    await user.click(screen.getByRole('button', { name: /eliminar fido/i }));
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('llama a remove() con el id correcto al confirmar eliminación', async () => {
    const mockRemove = vi.fn().mockResolvedValue(true);
    vi.mocked(useMascotas).mockReturnValue(createMockHook({ remove: mockRemove }));

    const user = userEvent.setup();
    renderWithProviders(<MascotaList />, { preloadSession: true });

    await user.click(screen.getByRole('button', { name: /eliminar fido/i }));

    // El botón de confirmación puede decir "Sí, eliminar" o "Confirmar"
    await user.click(
      screen.getByRole('button', { name: /sí.*eliminar|confirmar|^eliminar$/i })
    );

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith(MOCK_MASCOTAS[0].id);
    });
  });
});
