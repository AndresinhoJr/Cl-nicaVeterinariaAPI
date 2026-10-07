import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTratamientos, createTratamiento, deleteTratamiento } from '../../services/tratamiento.service';
import { getCitas } from '../../services/cita.service';
import { isApiError } from '../../api/axiosClient';
import type { TratamientoResponse } from '../../types/tratamiento.types';
import type { CitaResponse } from '../../types/cita.types';
import {
  PillIcon,
  SearchIcon,
  PlusIcon,
  TrashIcon,
  CloseIcon,
  AlertIcon,
  GenericPetIcon
} from '../../components/common/Icons';
import styles from './TratamientoList.module.css';

function formatFecha(iso: string) {
  if (!iso || iso.startsWith('0001')) return 'Fecha no registrada';
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export function TratamientoList() {
  const { hasRole } = useAuth();
  const isAdminOrVet = hasRole('Admin', 'Veterinario');

  const [tratamientos, setTratamientos] = useState<TratamientoResponse[]>([]);
  const [citas, setCitas] = useState<CitaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda
  const [busqueda, setBusqueda] = useState('');

  // Modal nuevo tratamiento
  const [showModal, setShowModal] = useState(false);
  const [citaId, setCitaId] = useState<number | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [costo, setCosto] = useState<number | ''>('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Modal eliminar
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTratamientos();
      setTratamientos(data);
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError('Error al cargar la lista de tratamientos.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (isAdminOrVet) {
      getCitas({ page: 1, pageSize: 100 })
        .then((res) => setCitas(res.items))
        .catch(() => {});
    }
  }, [isAdminOrVet]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaId || !descripcion.trim() || costo === '' || Number(costo) < 0) {
      setModalError('Todos los campos son obligatorios y el costo debe ser válido.');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      await createTratamiento({
        citaId: Number(citaId),
        descripcion: descripcion.trim(),
        costo: Number(costo),
      });
      setShowModal(false);
      setCitaId('');
      setDescripcion('');
      setCosto('');
      await fetchData();
    } catch (err) {
      if (isApiError(err)) {
        setModalError(err.message);
      } else {
        setModalError('No se pudo registrar el tratamiento.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await deleteTratamiento(id);
      setDeletingId(null);
      await fetchData();
    } catch {
      alert('Error al eliminar el tratamiento.');
    }
  };

  const filtrados = tratamientos.filter((t) =>
    t.nombreMascota.toLowerCase().includes(busqueda.toLowerCase()) ||
    t.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const costoTotal = filtrados.reduce((acc, t) => acc + t.costo, 0);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.titleBadge}>
            <PillIcon size={13} />
            Módulo Médico
          </div>
          <h1 className={styles.title}>
            Tratamientos Médicos
          </h1>
          <p className={styles.subtitle}>
            Historial clínico de medicaciones, procedimientos y costos asociados
          </p>
        </div>
        {isAdminOrVet && (
          <button
            type="button"
            className={styles.btnNew}
            onClick={() => { setShowModal(true); setModalError(null); }}
          >
            <PlusIcon size={16} />
            Nuevo Tratamiento
          </button>
        )}
      </header>

      {/* Métricas rápidas */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total tratamientos</span>
          <span className={styles.statValue}>{filtrados.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Inversión acumulada</span>
          <span className={styles.statValue}>{formatCLP(costoTotal)}</span>
        </div>
      </div>

      {/* Buscador */}
      <div className={styles.searchBar}>
        <div className={styles.searchIconWrapper}>
          <SearchIcon size={17} />
        </div>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Buscar por mascota o tratamiento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Estados */}
      {loading && (
        <div className={styles.loading}>
          <div style={{
            width: '28px',
            height: '28px',
            border: '3px solid rgba(168,85,247,0.2)',
            borderTopColor: '#c084fc',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p>Cargando tratamientos médicos...</p>
        </div>
      )}

      {!loading && error && (
        <div className={styles.error}>
          <AlertIcon size={24} style={{ color: '#fb7185' }} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && filtrados.length === 0 && (
        <div className={styles.empty}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
          }}>
            <PillIcon size={24} />
          </div>
          <p>No se encontraron tratamientos registrados.</p>
        </div>
      )}

      {/* Tabla de tratamientos */}
      {!loading && !error && filtrados.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table} aria-label="Listado de tratamientos médicos">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mascota</th>
                <th>Fecha de Cita</th>
                <th>Descripción del Tratamiento / Procedimiento</th>
                <th>Costo</th>
                {isAdminOrVet && <th style={{ textAlign: 'right' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((t) => (
                <tr key={t.id}>
                  <td style={{ opacity: 0.5, fontVariantNumeric: 'tabular-nums' }}>#{t.id}</td>
                  <td>
                    <div className={styles.mascotaTag}>
                      <div className={styles.mascotaAvatar}>
                        <GenericPetIcon size={15} />
                      </div>
                      <span>{t.nombreMascota}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.fechaTag}>{formatFecha(t.fechaCita)}</span>
                  </td>
                  <td>{t.descripcion}</td>
                  <td>
                    <span className={styles.costoTag}>{formatCLP(t.costo)}</span>
                  </td>
                  {isAdminOrVet && (
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className={styles.btnDel}
                        title="Eliminar tratamiento"
                        aria-label={`Eliminar tratamiento #${t.id}`}
                        onClick={() => setDeletingId(t.id)}
                      >
                        <TrashIcon size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Registrar nuevo tratamiento */}
      {showModal && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Registrar tratamiento">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconBox}>
                  <PillIcon size={20} />
                </div>
                <div>
                  <h2 className={styles.modalTitle}>
                    Registrar Tratamiento
                  </h2>
                  <p className={styles.modalSubtitle}>
                    Asocia medicación o procedimiento clínico a una cita médica
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setShowModal(false)}
                aria-label="Cerrar modal"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {modalError && (
              <div className={styles.modalAlert}>
                <AlertIcon size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCrear}>
              <div className={styles.field}>
                <label className={styles.label}>Cita médica asociada *</label>
                <select
                  className={styles.select}
                  value={citaId}
                  onChange={(e) => setCitaId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">— Selecciona la cita médica —</option>
                  {citas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombreMascota} — {formatFecha(c.fecha)} ({c.motivo})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Descripción del tratamiento / Medicación *</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Ej. Limpieza dental ultrasónica y antibiótico por 5 días..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Costo en CLP *</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  className={styles.input}
                  placeholder="25000"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value ? Number(e.target.value) : '')}
                />
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowModal(false)}
                  disabled={modalLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Guardando...' : 'Registrar tratamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar eliminación */}
      {deletingId !== null && (
        <div className={styles.overlay} role="alertdialog" aria-modal="true">
          <div className={styles.modal} style={{ maxWidth: '440px' }}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconBox} style={{ background: 'rgba(244,63,94,0.12)', borderColor: 'rgba(244,63,94,0.25)', color: '#fb7185' }}>
                  <TrashIcon size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>¿Eliminar tratamiento?</h3>
                  <p className={styles.modalSubtitle}>Esta acción no se puede deshacer</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setDeletingId(null)}
                aria-label="Cerrar modal"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas eliminar este tratamiento médico? Se removerá del registro histórico de la mascota.
            </p>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setDeletingId(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={() => handleEliminar(deletingId)}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
