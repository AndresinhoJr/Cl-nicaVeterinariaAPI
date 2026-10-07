import { useCallback, useEffect, useState } from 'react';
import {
  getCitas,
  createCita,
  updateCita,
  deleteCita,
} from '../../services/cita.service';
import { isApiError } from '../../api/axiosClient';
import type { CitaResponse, CitasQueryParams } from '../../types/cita.types';
import type { PagedResult } from '../../types/common.types';

interface ListState {
  data: PagedResult<CitaResponse> | null;
  loading: boolean;
  error: string | null;
}

interface MutationState {
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
}

const INITIAL_MUTATION: MutationState = { loading: false, error: null, fieldErrors: null };

export function useCitas(initialParams: CitasQueryParams = {}) {
  const [params, setParams] = useState<CitasQueryParams>({
    page: 1,
    pageSize: 10,
    ...initialParams,
  });

  const [list, setList] = useState<ListState>({ data: null, loading: true, error: null });
  const [mutation, setMutation] = useState<MutationState>(INITIAL_MUTATION);

  const fetchList = useCallback(async () => {
    setList((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getCitas(params);
      setList({ data, loading: false, error: null });
    } catch (err) {
      const msg = isApiError(err) ? err.message : 'Error desconocido al cargar citas.';
      setList((s) => ({ ...s, loading: false, error: msg }));
    }
  }, [params]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const goToPage = (page: number) => setParams((p) => ({ ...p, page }));

  const create = useCallback(async (values: {
    mascotaId: number;
    fecha: string;
    motivo: string;
  }): Promise<CitaResponse | null> => {
    setMutation({ loading: true, error: null, fieldErrors: null });
    try {
      const created = await createCita(values);
      setMutation(INITIAL_MUTATION);
      await fetchList();
      return created;
    } catch (err) {
      if (isApiError(err)) {
        setMutation({ loading: false, error: err.message, fieldErrors: err.errors ?? null });
      } else {
        setMutation({ loading: false, error: 'Error inesperado.', fieldErrors: null });
      }
      return null;
    }
  }, [fetchList]);

  const update = useCallback(async (id: number, values: {
    fecha: string;
    motivo: string;
  }): Promise<CitaResponse | null> => {
    setMutation({ loading: true, error: null, fieldErrors: null });
    try {
      const updated = await updateCita(id, values);
      setMutation(INITIAL_MUTATION);
      await fetchList();
      return updated;
    } catch (err) {
      if (isApiError(err)) {
        setMutation({ loading: false, error: err.message, fieldErrors: err.errors ?? null });
      } else {
        setMutation({ loading: false, error: 'Error inesperado.', fieldErrors: null });
      }
      return null;
    }
  }, [fetchList]);

  const remove = useCallback(async (id: number): Promise<boolean> => {
    setMutation({ loading: true, error: null, fieldErrors: null });
    try {
      await deleteCita(id);
      setMutation(INITIAL_MUTATION);
      setParams((p) => ({ ...p }));
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
  }, [fetchList]);

  const clearMutationError = () => setMutation(INITIAL_MUTATION);

  return { list, params, goToPage, refetch: fetchList, mutation, create, update, remove, clearMutationError };
}
