import { useCallback, useState } from 'react';
import { getTratamientosByCita, createTratamiento, deleteTratamiento } from '../../services/tratamiento.service';
import { isApiError } from '../../api/axiosClient';
import type { TratamientoResponse } from '../../types/tratamiento.types';

interface TratamientosState {
  data: TratamientoResponse[];
  loading: boolean;
  error: string | null;
}

interface MutationState {
  loading: boolean;
  error: string | null;
}

export function useTratamientos() {
  const [state, setState] = useState<TratamientosState>({ data: [], loading: false, error: null });
  const [mutation, setMutation] = useState<MutationState>({ loading: false, error: null });

  const fetchByCita = useCallback(async (citaId: number) => {
    setState({ data: [], loading: true, error: null });
    try {
      const data = await getTratamientosByCita(citaId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const msg = isApiError(err) ? err.message : 'Error al cargar tratamientos.';
      setState({ data: [], loading: false, error: msg });
    }
  }, []);

  const create = useCallback(async (values: {
    citaId: number;
    descripcion: string;
    costo: number;
  }): Promise<TratamientoResponse | null> => {
    setMutation({ loading: true, error: null });
    try {
      const created = await createTratamiento(values);
      setMutation({ loading: false, error: null });
      // Recargar tratamientos de esa cita
      await fetchByCita(values.citaId);
      return created;
    } catch (err) {
      const msg = isApiError(err) ? err.message : 'Error al crear tratamiento.';
      setMutation({ loading: false, error: msg });
      return null;
    }
  }, [fetchByCita]);

  const remove = useCallback(async (id: number, citaId: number): Promise<boolean> => {
    setMutation({ loading: true, error: null });
    try {
      await deleteTratamiento(id);
      setMutation({ loading: false, error: null });
      await fetchByCita(citaId);
      return true;
    } catch (err) {
      const msg = isApiError(err) ? err.message : 'Error al eliminar tratamiento.';
      setMutation({ loading: false, error: msg });
      return false;
    }
  }, [fetchByCita]);

  const clearError = () => setMutation({ loading: false, error: null });

  return { state, mutation, fetchByCita, create, remove, clearError };
}
