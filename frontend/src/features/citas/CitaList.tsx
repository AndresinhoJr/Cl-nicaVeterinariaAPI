import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCitas } from './useCitas';
import { useTratamientos } from './useTratamientos';
import { useAuth } from '../../context/AuthContext';
import { getMascotas } from '../../services/mascota.service';
import type { CitaResponse } from '../../types/cita.types';
import type { MascotaResponse } from '../../types/mascota.types';
import {
  CalendarIcon,
  PillIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  CloseIcon,
  getSpeciesIcon,
} from '../../components/common/Icons';
import styles from './CitaList.module.css';

// ─── Schema Zod ───────────────────────────────────────────────────────────────

const citaSchema = z.object({
  mascotaId: z.coerce.number().min(1, 'Selecciona una mascota.'),
  fecha: z.string().min(1, 'La fecha es obligatoria.').refine((v) => {
    return new Date(v) > new Date();
  }, 'La fecha debe ser futura.'),
  motivo: z.string().min(5, 'Mínimo 5 caracteres.').max(255, 'Máximo 255 caracteres.'),
});

type CitaFormValues = z.infer<typeof citaSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

// ─── Componente principal ────────────────────────────────────────────────────

export function CitaList() {
  const { hasRole } = useAuth();
  const isAdminOrVet = hasRole('Admin', 'Veterinario');
  const isAdmin = hasRole('Admin');

  const { list, params, goToPage, mutation, create, update, remove, clearMutationError } = useCitas();
  const { state: tratState, fetchByCita } = useTratamientos();

  // Mascotas disponibles para el select del formulario
  const [mascotas, setMascotas] = useState<MascotaResponse[]>([]);

  // Modales
  const [showCitaModal, setShowCitaModal] = useState(false);
  const [editingCita, setEditingCita] = useState<CitaResponse | null>(null);
  const [deletingCita, setDeletingCita] = useState<CitaResponse | null>(null);
  const [selectedCitaForTrat, setSelectedCitaForTrat] = useState<CitaResponse | null>(null);

  const openTratamientosModal = (c: CitaResponse) => {
    setSelectedCitaForTrat(c);
    fetchByCita(c.id);
  };

  const overlayRef = useRef<HTMLDivElement>(null);

  // ── Cargar mascotas para el select ─────────────────────────────────────────
  useEffect(() => {
    getMascotas({ page: 1, pageSize: 100 }).then((res) => setMascotas(res.items as MascotaResponse[])).catch(() => {});
  }, []);

  // ── Formulario de cita ─────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CitaFormValues>({ resolver: zodResolver(citaSchema) });

  const openCreate = () => {
    setEditingCita(null);
    reset({ mascotaId: undefined as unknown as number, fecha: '', motivo: '' });
    clearMutationError();
    setShowCitaModal(true);
  };

  const openEdit = (c: CitaResponse) => {
    setEditingCita(c);
    const localDt = new Date(c.fecha).toISOString().slice(0, 16);
    reset({ mascotaId: c.mascotaId, fecha: localDt, motivo: c.motivo });
    clearMutationError();
    setShowCitaModal(true);
  };

  const closeModal = () => { setShowCitaModal(false); setEditingCita(null); };

  const onSubmitCita = handleSubmit(async (values) => {
    const isoFecha = new Date(values.fecha).toISOString();
    let ok: CitaResponse | null = null;
    if (editingCita) {
      ok = await update(editingCita.id, { fecha: isoFecha, motivo: values.motivo });
    } else {
      ok = await create({ mascotaId: values.mascotaId, fecha: isoFecha, motivo: values.motivo });
    }
    if (ok) closeModal();
  });

  // ── Escape para cerrar modales ─────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        setDeletingCita(null);
        setSelectedCitaForTrat(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Datos ──────────────────────────────────────────────────────────────────
  const totalPages = list.data ? Math.ceil(list.data.totalCount / (params.pageSize ?? 10)) : 1;
  const currentPage = params.page ?? 1;

  return (
    <main className={styles.page}>
      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <div className={styles.badgePill}>
            <span className={styles.badgeDot} />
            <span>Agenda Médica</span>
          </div>
          <h1 className={styles.title}>Citas Médicas</h1>
          <p className={styles.subtitle}>
            {list.data
              ? `${list.data.totalCount} cita${list.data.totalCount !== 1 ? 's' : ''} en total`
              : 'Cargando...'}
          </p>
        </div>
        {/* Solo Admin y Veterinario pueden crear citas */}
        {isAdminOrVet && (
          <button className={styles.btnNew} onClick={openCreate} id="btn-nueva-cita">
            Nueva Cita
          </button>
        )}
      </header>

      {/* ── Estados ──────────────────────────────────────────────────────── */}
      {list.loading && (
        <div className={styles.loading}>
          {[...Array(6)].map((_, i) => <div key={i} className={styles.skeletonRow} style={{ width: '100%' }} />)}
        </div>
      )}

      {!list.loading && list.error && (
        <div className={styles.error}>
          <span>{list.error}</span>
        </div>
      )}

      {!list.loading && !list.error && list.data?.items.length === 0 && (
        <div className={styles.empty}>
          <CalendarIcon size={36} className={styles.mutedIcon} />
          <span>No hay citas registradas.</span>
          {isAdminOrVet && <button className={styles.btnNew} onClick={openCreate}>Crear primera cita</button>}
        </div>
      )}

      {/* ── Tabla ────────────────────────────────────────────────────────── */}
      {!list.loading && !list.error && (list.data?.items.length ?? 0) > 0 && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table} aria-label="Listado de citas médicas">
              <thead>
                <tr>
                  <th>Mascota</th>
                  <th>Fecha</th>
                  <th>Motivo</th>
                  {isAdminOrVet && <th>Dueño</th>}
                  <th>Tratamientos</th>
                  <th>Costo total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.data!.items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.mascotaInfo}>
                        <div className={styles.mascotaHeader}>
                          <span className={styles.speciesIconWrapper}>
                            {getSpeciesIcon(c.especieMascota, 18)}
                          </span>
                          <span className={styles.mascotaNombre}>{c.nombreMascota}</span>
                        </div>
                        <span className={styles.mascotaEsp}>{c.especieMascota}</span>
                      </div>
                    </td>
                    <td className={styles.fecha}>{formatFecha(c.fecha)}</td>
                    <td><span className={styles.motivo} title={c.motivo}>{c.motivo}</span></td>
                    {isAdminOrVet && (
                      <td className={styles.duenoInfo}>{c.nombreDueno ?? (c as any).nombreDueño}</td>
                    )}
                    <td>
                      {c.totalTratamientos > 0 ? (
                        <button
                          type="button"
                          className={styles.badgeTratBtn}
                          onClick={() => openTratamientosModal(c)}
                          title="Ver tratamientos de la cita"
                          aria-label={`Ver ${c.totalTratamientos} tratamiento(s) de la cita de ${c.nombreMascota}`}
                        >
                          <PillIcon size={13} />
                          {c.totalTratamientos} {c.totalTratamientos === 1 ? 'tratamiento' : 'tratamientos'}
                        </button>
                      ) : (
                        <span className={styles.badgeTratZero}>
                          <PillIcon size={13} /> 0
                        </span>
                      )}
                    </td>
                    <td className={styles.costo}>{formatCLP(c.costoTotalTratamientos)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={`${styles.btnIcon} ${styles.btnView}`}
                          title="Ver detalle y tratamientos"
                          aria-label={`Ver detalle de la cita de ${c.nombreMascota}`}
                          onClick={() => openTratamientosModal(c)}
                        >
                          <EyeIcon size={15} />
                        </button>
                        {isAdminOrVet && (
                          <button
                            type="button"
                            className={`${styles.btnIcon} ${styles.btnEdit}`}
                            title="Editar cita"
                            aria-label={`Editar cita de ${c.nombreMascota}`}
                            onClick={() => openEdit(c)}
                          >
                            <EditIcon size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            className={`${styles.btnIcon} ${styles.btnDel}`}
                            title="Eliminar cita"
                            aria-label={`Eliminar cita de ${c.nombreMascota}`}
                            onClick={() => setDeletingCita(c)}
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Paginación ────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Paginación de citas">
              <span>{list.data!.totalCount} citas · Página {currentPage} de {totalPages}</span>
              <div className={styles.pageBtns}>
                <button className={styles.pageBtn} disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>‹ Anterior</button>
                <span className={styles.pageCurrent}>{currentPage}</span>
                <button className={styles.pageBtn} disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>Siguiente ›</button>
              </div>
            </nav>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: Crear / Editar cita
          ════════════════════════════════════════════════════════════════════ */}
      {showCitaModal && (
        <div
          className={styles.overlay}
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={editingCita ? 'Editar cita' : 'Nueva cita'}
          onClick={(e) => { if (e.target === overlayRef.current) closeModal(); }}
        >
          <div className={styles.modal}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {editingCita ? <EditIcon size={16} /> : <CalendarIcon size={16} />}
              </div>
              <h2 className={styles.modalTitle}>{editingCita ? 'Editar Cita Médica' : 'Nueva Cita Médica'}</h2>
            </div>

            {mutation.error && (
              <div className={styles.alertError} role="alert">{mutation.error}</div>
            )}

            <form id="cita-form" className={styles.form} onSubmit={onSubmitCita} noValidate>
              {/* Mascota (solo al crear) */}
              {!editingCita && (
                <div className={styles.field}>
                  <label htmlFor="cita-mascota" className={styles.label}>Mascota</label>
                  <select
                    id="cita-mascota"
                    className={`${styles.select} ${errors.mascotaId ? styles.inputError : ''}`}
                    aria-invalid={Boolean(errors.mascotaId)}
                    {...register('mascotaId')}
                  >
                    <option value="">— Selecciona una mascota —</option>
                    {mascotas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} ({m.especie})
                        {isAdminOrVet && (m.nombreDueno || (m as any).nombreDueño) ? ` — Dueño: ${m.nombreDueno ?? (m as any).nombreDueño}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.mascotaId && <p className={styles.fieldError} role="alert">{errors.mascotaId.message}</p>}
                </div>
              )}

              {/* Fecha */}
              <div className={styles.field}>
                <label htmlFor="cita-fecha" className={styles.label}>Fecha y hora</label>
                <input
                  id="cita-fecha"
                  type="datetime-local"
                  className={`${styles.input} ${errors.fecha ? styles.inputError : ''}`}
                  aria-invalid={Boolean(errors.fecha)}
                  aria-describedby={errors.fecha ? 'fecha-err' : undefined}
                  {...register('fecha')}
                />
                {errors.fecha && <p id="fecha-err" className={styles.fieldError} role="alert">{errors.fecha.message}</p>}
              </div>

              {/* Motivo */}
              <div className={styles.field}>
                <label htmlFor="cita-motivo" className={styles.label}>Motivo de la consulta</label>
                <textarea
                  id="cita-motivo"
                  className={`${styles.textarea} ${errors.motivo ? styles.inputError : ''}`}
                  placeholder="Describe el motivo de la cita..."
                  aria-invalid={Boolean(errors.motivo)}
                  aria-describedby={errors.motivo ? 'motivo-err' : undefined}
                  {...register('motivo')}
                />
                {errors.motivo && <p id="motivo-err" className={styles.fieldError} role="alert">{errors.motivo.message}</p>}
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnSecondary} onClick={closeModal}>Cancelar</button>
                <button type="submit" className={styles.btnPrimary} disabled={mutation.loading}>
                  {mutation.loading ? 'Guardando...' : editingCita ? 'Guardar cambios' : 'Crear cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: Confirmar eliminación
          ════════════════════════════════════════════════════════════════════ */}
      {deletingCita && (
        <div
          className={styles.overlay}
          role="alertdialog"
          aria-modal="true"
          aria-label="Confirmar eliminación de cita"
        >
          <div className={styles.modal}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <TrashIcon size={16} />
              </div>
              <h2 className={styles.modalTitle}>Eliminar Cita Médica</h2>
            </div>
            <p style={{ color: 'var(--cv-text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              ¿Estás seguro que deseas eliminar la cita de{' '}
              <strong>{deletingCita.nombreMascota}</strong> del{' '}
              <strong>{formatFecha(deletingCita.fecha)}</strong>?
              <br />Esta acción no se puede deshacer.
            </p>
            {mutation.error && <div className={styles.alertError} role="alert">⚠️ {mutation.error}</div>}
            <div className={styles.formActions}>
              <button className={styles.btnSecondary} onClick={() => setDeletingCita(null)}>Cancelar</button>
              <button
                className={styles.btnDanger}
                disabled={mutation.loading}
                onClick={async () => {
                  const ok = await remove(deletingCita.id);
                  if (ok) setDeletingCita(null);
                }}
              >
                {mutation.loading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: Detalle de Tratamientos (Solo lectura / Consulta)
          ════════════════════════════════════════════════════════════════════ */}
      {selectedCitaForTrat && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label="Detalle de tratamientos de la cita"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedCitaForTrat(null); }}
        >
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className={styles.modalBadge}>
                  <PillIcon size={13} />
                  <span>Tratamientos de la Cita</span>
                </div>
                <h2 className={styles.detailTitle}>
                  {selectedCitaForTrat.nombreMascota}
                </h2>
                <p className={styles.detailSub}>
                  Fecha: {formatFecha(selectedCitaForTrat.fecha)} &bull; Especie: {selectedCitaForTrat.especieMascota}
                </p>
                <p className={styles.detailSub} style={{ marginTop: '0.25rem' }}>
                  Motivo: <em>"{selectedCitaForTrat.motivo}"</em>
                </p>
              </div>
              <button
                type="button"
                className={styles.btnClose}
                onClick={() => setSelectedCitaForTrat(null)}
                title="Cerrar"
                aria-label="Cerrar modal"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {tratState.loading && (
              <div className={styles.centerState}>
                <p>Cargando información médica y tratamientos...</p>
              </div>
            )}

            {!tratState.loading && tratState.error && (
              <div className={styles.alertError} role="alert">
                {tratState.error}
              </div>
            )}

            {!tratState.loading && !tratState.error && tratState.data.length === 0 && (
              <div className={styles.centerState}>
                <PillIcon size={36} className={styles.mutedIcon} />
                <span>No hay tratamientos ni recetas médicas registradas para esta cita aún.</span>
              </div>
            )}

            {!tratState.loading && !tratState.error && tratState.data.length > 0 && (
              <>
                <div className={styles.tratList}>
                  {tratState.data.map((t, idx) => (
                    <div key={t.id} className={styles.tratCard}>
                      <div>
                        <div className={styles.tratDesc}>
                          <span style={{ marginRight: '0.4rem', color: 'var(--cv-primary)', fontWeight: 700 }}>#{idx + 1}</span>
                          {t.descripcion}
                        </div>
                        <div className={styles.tratMeta}>
                          Prescripción / Procedimiento clínico
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className={styles.tratCosto}>{formatCLP(t.costo)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--cv-border)',
                  paddingTop: '1rem',
                  marginTop: '1rem'
                }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--cv-text-muted)' }}>
                    Total prescripciones: <strong>{tratState.data.length}</strong>
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--cv-primary)' }}>
                    Costo total: {formatCLP(selectedCitaForTrat.costoTotalTratamientos)}
                  </span>
                </div>
              </>
            )}

            <div className={styles.formActions} style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setSelectedCitaForTrat(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
