import { useCallback, useEffect, useState } from 'react';
import {
  getMascotas,
  getMascotaById,
  createMascota,
  updateMascota,
  deleteMascota,
} from '../../services/mascota.service';
import { isApiError } from '../../api/axiosClient';
import type { MascotaResponse, MascotasQueryParams } from '../../types/mascota.types';
import type { MascotaFormValues } from './mascota.schema';
import type { PagedResult } from '../../types/common.types';

// ─── Estado del listado ───────────────────────────────────────────────────────

interface ListState {
  data: PagedResult<MascotaResponse> | null;
  loading: boolean;
  error: string | null;
}

// ─── Estado de mutación (crear / editar / eliminar) ───────────────────────────

interface MutationState {
  loading: boolean;
  error: string | null;
  /** Errores de campo devueltos por el servidor (HTTP 400 validation) */
  fieldErrors: Record<string, string[]> | null;
}

const INITIAL_MUTATION: MutationState = {
  loading: false,
  error: null,
  fieldErrors: null,
};

// ─── Hook principal ────────────────────────────────────────────────────────────

export function useMascotas(initialParams: MascotasQueryParams = {}) {
  const [params, setParams] = useState<MascotasQueryParams>({
    page: 1,
    pageSize: 9,
    ...initialParams,
  });

  const [list, setList] = useState<ListState>({
    data: null,
    loading: true,
    error: null,
  });

  const [mutation, setMutation] = useState<MutationState>(INITIAL_MUTATION);

  // ── Cargar listado ──────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setList((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getMascotas(params);
      setList({ data, loading: false, error: null });
    } catch (err) {
      const msg = isApiError(err)
        ? err.message
        : 'Error desconocido al cargar mascotas.';
      setList((s) => ({ ...s, loading: false, error: msg }));
    }
  }, [params]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ── Cambiar página ──────────────────────────────────────────────────────────
  const goToPage = (page: number) =>
    setParams((p) => ({ ...p, page }));

  // ── Cambiar filtros ─────────────────────────────────────────────────────────
  const applyFilters = (filters: Partial<MascotasQueryParams>) =>
    setParams((p) => ({ ...p, ...filters, page: 1 }));

  // ── Crear mascota ──────────────────────────────────────────────────────────
  const create = useCallback(async (values: MascotaFormValues): Promise<MascotaResponse | null> => {
    setMutation({ loading: true, error: null, fieldErrors: null });
    try {
      const created = await createMascota({
        nombre: values.nombre,
        especie: values.especie,
        duenoId: values.duenoId ?? undefined,
      });
      setMutation(INITIAL_MUTATION);
      await fetchList();
      return created;
    } catch (err) {
      if (isApiError(err)) {
        setMutation({
          loading: false,
          error: err.message,
          fieldErrors: err.errors ?? null,
        });
      } else {
        setMutation({ loading: false, error: 'Error inesperado.', fieldErrors: null });
      }
      return null;
    }
  }, [fetchList]);

  // ── Editar mascota ─────────────────────────────────────────────────────────
  const update = useCallback(async (
    id: number,
    values: MascotaFormValues,
  ): Promise<MascotaResponse | null> => {
    setMutation({ loading: true, error: null, fieldErrors: null });
    try {
      const updated = await updateMascota(id, {
        nombre: values.nombre,
        especie: values.especie,
        duenoId: values.duenoId ?? undefined,
      });
      setMutation(INITIAL_MUTATION);
      await fetchList();
      return updated;
    } catch (err) {
      if (isApiError(err)) {
        setMutation({
          loading: false,
          error: err.message,
          fieldErrors: err.errors ?? null,
        });
      } else {
        setMutation({ loading: false, error: 'Error inesperado.', fieldErrors: null });
      }
      return null;
    }
  }, [fetchList]);

  // ── Eliminar mascota ───────────────────────────────────────────────────────
  const remove = useCallback(async (id: number): Promise<boolean> => {
    setMutation({ loading: true, error: null, fieldErrors: null });
    try {
      await deleteMascota(id);
      setMutation(INITIAL_MUTATION);
      // Si borramos el último item de la página, retrocedemos
      setParams((p) => {
        const itemsLeft = (list.data?.items.length ?? 1) - 1;
        const shouldGoBack = itemsLeft === 0 && (p.page ?? 1) > 1;
        return shouldGoBack ? { ...p, page: (p.page ?? 1) - 1 } : p;
      });
      await fetchList();
      return true;
    } catch (err) {
      if (isApiError(err)) {
        setMutation({ loading: false, error: err.message, fieldErrors: null });
      } else {
        setMutation({ loading: false, error: 'Error inesperado al eliminar.', fieldErrors: null });
      }
      return false;
    }
  }, [fetchList, list.data?.items.length]);

  // ── Cargar un mascota por ID (para pre-poblar el formulario de edición) ────
  const getById = useCallback(async (id: number): Promise<MascotaResponse | null> => {
    try {
      return await getMascotaById(id);
    } catch {
      return null;
    }
  }, []);

  const clearMutationError = () => setMutation(INITIAL_MUTATION);

  return {
    // Listado
    list,
    params,
    goToPage,
    applyFilters,
    refetch: fetchList,
    // Mutaciones
    mutation,
    create,
    update,
    remove,
    getById,
    clearMutationError,
  };
}
