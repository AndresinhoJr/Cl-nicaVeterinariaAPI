import { useEffect, useRef, useState } from 'react';
import { useMascotas } from './useMascotas';
import { MascotaForm } from './MascotaForm';
import { DeleteModal } from './DeleteModal';
import { useAuth } from '../../context/AuthContext';
import { getCitas } from '../../services/cita.service';
import { getTratamientosByMascota } from '../../services/tratamiento.service';
import type { MascotaResponse } from '../../types/mascota.types';
import type { MascotaFormValues } from './mascota.schema';
import type { CitaResponse } from '../../types/cita.types';
import type { TratamientoResponse } from '../../types/tratamiento.types';
import { ESPECIES_VALIDAS } from '../../types/mascota.types';
import {
  CalendarIcon,
  PillIcon,
  EditIcon,
  TrashIcon,
  PlusIcon,
  CloseIcon,
  FilterIcon,
  getSpeciesIcon,
  GenericPetIcon,
  AlertIcon,
} from '../../components/common/Icons';

import styles from './MascotaList.module.css';

// ─── Helpers de formato ───────────────────────────────────────────────────────
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function formatCLP(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function MascotaCardSkeleton() {
  return (
    <div className={styles.cardSkeleton} aria-hidden="true">
      <div className={styles.skeletonHeader}>
        <div className={`${styles.skeletonLine} ${styles.skeletonAvatar}`} />
        <div style={{ flex: 1 }}>
          <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonBadge}`} />
        </div>
      </div>
      <div className={`${styles.skeletonLine} ${styles.skeletonMeta}`} />
      <div className={styles.skeletonActions}>
        <div className={`${styles.skeletonLine} ${styles.skeletonBtn}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonBtn}`} />
      </div>
    </div>
  );
}

// ─── Tarjeta de mascota ───────────────────────────────────────────────────────
interface MascotaCardProps {
  mascota: MascotaResponse;
  isAdminOrVet: boolean;
  isAdmin: boolean;
  onEdit: (m: MascotaResponse) => void;
  onDelete: (m: MascotaResponse) => void;
  onViewCitas: (m: MascotaResponse) => void;
  onViewTratamientos: (m: MascotaResponse) => void;
  /** refs para restaurar foco al cerrar modales (WCAG 2.4.3) */
  editBtnRef?: React.RefObject<HTMLButtonElement>;
  deleteBtnRef?: React.RefObject<HTMLButtonElement>;
}
function getSpeciesTheme(especie: string) {

  const norm = (especie || '').toLowerCase().trim();
  if (norm.includes('perr') || norm.includes('can')) {
    return {
      avatarBg: 'rgba(56, 189, 248, 0.12)',
      avatarBorder: 'rgba(56, 189, 248, 0.28)',
      avatarColor: '#38bdf8',
      badgeBg: 'rgba(56, 189, 248, 0.1)',
      badgeBorder: 'rgba(56, 189, 248, 0.25)',
      badgeColor: '#38bdf8',
    };
  }
  if (norm.includes('gat') || norm.includes('felin')) {
    return {
      avatarBg: 'rgba(52, 211, 153, 0.12)',
      avatarBorder: 'rgba(52, 211, 153, 0.28)',
      avatarColor: '#34d399',
      badgeBg: 'rgba(52, 211, 153, 0.1)',
      badgeBorder: 'rgba(52, 211, 153, 0.25)',
      badgeColor: '#34d399',
    };
  }
  if (norm.includes('av') || norm.includes('pajar')) {
    return {
      avatarBg: 'rgba(251, 191, 36, 0.12)',
      avatarBorder: 'rgba(251, 191, 36, 0.28)',
      avatarColor: '#fbbf24',
      badgeBg: 'rgba(251, 191, 36, 0.1)',
      badgeBorder: 'rgba(251, 191, 36, 0.25)',
      badgeColor: '#fbbf24',
    };
  }
  if (norm.includes('conej') || norm.includes('roed')) {
    return {
      avatarBg: 'rgba(192, 132, 252, 0.12)',
      avatarBorder: 'rgba(192, 132, 252, 0.28)',
      avatarColor: '#c084fc',
      badgeBg: 'rgba(192, 132, 252, 0.1)',
      badgeBorder: 'rgba(192, 132, 252, 0.25)',
      badgeColor: '#c084fc',
    };
  }
  if (norm.includes('rept') || norm.includes('iguan') || norm.includes('tortug')) {
    return {
      avatarBg: 'rgba(45, 212, 191, 0.12)',
      avatarBorder: 'rgba(45, 212, 191, 0.28)',
      avatarColor: '#2dd4bf',
      badgeBg: 'rgba(45, 212, 191, 0.1)',
      badgeBorder: 'rgba(45, 212, 191, 0.25)',
      badgeColor: '#2dd4bf',
    };
  }
  return {
    avatarBg: 'rgba(148, 163, 184, 0.12)',
    avatarBorder: 'rgba(148, 163, 184, 0.28)',
    avatarColor: '#94a3b8',
    badgeBg: 'rgba(148, 163, 184, 0.1)',
    badgeBorder: 'rgba(148, 163, 184, 0.25)',
    badgeColor: '#94a3b8',
  };
}

function MascotaCard({
  mascota,
  isAdmin,
  isAdminOrVet,
  onEdit,
  onDelete,
  onViewCitas,
  onViewTratamientos,
  editBtnRef,
  deleteBtnRef,
}: MascotaCardProps) {
  const headingId = `mascota-heading-${mascota.id}`;
  const theme = getSpeciesTheme(mascota.especie);

  return (
    <article
      className={styles.card}
      aria-labelledby={headingId}
    >
      <header className={styles.cardHeader}>
        <div
          className={styles.speciesAvatar}
          style={{
            background: theme.avatarBg,
            borderColor: theme.avatarBorder,
            color: theme.avatarColor,
          }}
          aria-hidden="true"
        >
          {getSpeciesIcon(mascota.especie, 22)}
        </div>
        <div className={styles.cardInfo}>
          <div className={styles.cardTopRow}>
            <h3 id={headingId} className={styles.cardName}>{mascota.nombre}</h3>
            <span
              className={styles.cardSpecies}
              style={{
                background: theme.badgeBg,
                borderColor: theme.badgeBorder,
                color: theme.badgeColor,
              }}
            >
              {mascota.especie}
            </span>
          </div>
        </div>
      </header>

      {isAdminOrVet && (
        <dl className={styles.cardDetails}>
          <div className={styles.detailRow}>
            <dt>Dueño</dt>
            <dd>{mascota.nombreDueno}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Email</dt>
            <dd className={styles.emailCell}>{mascota.emailDueno}</dd>
          </div>
        </dl>
      )}

      <footer className={styles.cardFooter}>
        {isAdminOrVet ? (
          <>
            <button
              type="button"
              className={styles.btnCitas}
              onClick={() => onViewCitas(mascota)}
              aria-label={`Ver citas médicas de ${mascota.nombre}`}
              title="Ver citas médicas"
            >
              <CalendarIcon size={14} /> Citas
            </button>
            <button
              type="button"
              className={styles.btnTratamientos}
              onClick={() => onViewTratamientos(mascota)}
              aria-label={`Ver tratamientos de ${mascota.nombre}`}
              title="Ver tratamientos médicos"
            >
              <PillIcon size={14} /> Ficha
            </button>
            <button
              ref={editBtnRef}
              id={`edit-mascota-${mascota.id}`}
              type="button"
              className={styles.btnEdit}
              onClick={() => onEdit(mascota)}
              aria-label={`Editar ${mascota.nombre}`}
              title="Editar datos de mascota"
            >
              <EditIcon size={14} /> Editar
            </button>
            {isAdmin && (
              <button
                ref={deleteBtnRef}
                id={`delete-mascota-${mascota.id}`}
                type="button"
                className={styles.btnDelete}
                onClick={() => onDelete(mascota)}
                aria-label={`Eliminar ${mascota.nombre}`}
                title="Eliminar mascota"
              >
                <TrashIcon size={14} />
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.btnCitas}
              onClick={() => onViewCitas(mascota)}
              aria-label={`Ver citas médicas de ${mascota.nombre}`}
            >
              <CalendarIcon size={15} /> Citas
            </button>
            <button
              type="button"
              className={styles.btnTratamientos}
              onClick={() => onViewTratamientos(mascota)}
              aria-label={`Ver tratamientos de ${mascota.nombre}`}
            >
              <PillIcon size={15} /> Tratamientos
            </button>
          </>
        )}
      </footer>
    </article>
  );
}

// ─── Estado vacío ─────────────────────────────────────────────────────────────
function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className={styles.emptyState} role="status" aria-live="polite">
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b'
      }}>
        <GenericPetIcon size={28} />
      </div>
      <p className={styles.emptyTitle}>
        {filtered ? 'Sin resultados para esa búsqueda' : 'No hay mascotas aún'}
      </p>
      <p style={{ margin: 0, fontSize: '0.875rem' }}>
        {filtered
          ? 'Intenta con otro filtro de especie.'
          : 'Crea la primera mascota con el botón de arriba.'}
      </p>
    </div>
  );
}

// ─── Estado de error ──────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.errorState} role="alert" aria-live="assertive">
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: 'rgba(244,63,94,0.12)',
        border: '1px solid rgba(244,63,94,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fb7185'
      }}>
        <AlertIcon size={28} />
      </div>
      <p className={styles.errorTitle}>Error al cargar las mascotas</p>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>{message}</p>
      <button id="retry-mascotas" type="button" className={styles.btnRetry} onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}


// ─── Paginación ───────────────────────────────────────────────────────────────
interface PaginatorProps {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPage: (p: number) => void;
}

function Paginator({ page, totalPages, hasNext, hasPrev, onPage }: PaginatorProps) {
  if (totalPages <= 1) return null;
  return (
    <nav className={styles.paginator} aria-label="Paginación de mascotas">
      <button
        id="paginator-prev"
        type="button"
        className={styles.pageBtn}
        disabled={!hasPrev}
        onClick={() => onPage(page - 1)}
        aria-label="Ir a la página anterior"
      >
        <span aria-hidden="true">←</span>
      </button>
      {/*
        aria-current="page" no aplica a números de página directos aquí,
        pero la región aria-live anuncia el cambio de texto.
      */}
      <span className={styles.pageInfo} aria-live="polite" aria-atomic="true">
        Página <strong>{page}</strong> de <strong>{totalPages}</strong>
      </span>
      <button
        id="paginator-next"
        type="button"
        className={styles.pageBtn}
        disabled={!hasNext}
        onClick={() => onPage(page + 1)}
        aria-label="Ir a la página siguiente"
      >
        <span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; mascota: MascotaResponse }
  | { type: 'delete'; mascota: MascotaResponse };

export function MascotaList() {
  const { hasRole } = useAuth();
  const isAdminOrVet = hasRole('Admin', 'Veterinario');
  const isAdmin = hasRole('Admin');

  const { list, params, goToPage, applyFilters, refetch, mutation, create, update, remove } =
    useMascotas();

  const [modal, setModal] = useState<ModalState>({ type: 'none' });

  // Estados para modales de consulta de Citas y Tratamientos
  const [citasModalMascota, setCitasModalMascota] = useState<MascotaResponse | null>(null);
  const [citasList, setCitasList] = useState<CitaResponse[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [errorCitas, setErrorCitas] = useState<string | null>(null);

  const [tratamientosModalMascota, setTratamientosModalMascota] = useState<MascotaResponse | null>(null);
  const [tratamientosList, setTratamientosList] = useState<TratamientoResponse[]>([]);
  const [loadingTratamientos, setLoadingTratamientos] = useState(false);
  const [errorTratamientos, setErrorTratamientos] = useState<string | null>(null);

  /*
    WCAG 2.4.3 Focus Order: guardar referencia del botón que abrió el modal
    para restaurar foco al cerrarlo.
  */
  const createBtnRef = useRef<HTMLButtonElement>(null);
  const lastDeleteTriggerRef = useRef<HTMLButtonElement>(null);
  const lastEditTriggerRef = useRef<HTMLButtonElement>(null);
  const formModalRef = useRef<HTMLDivElement>(null);

  const isFiltered = Boolean(params.especie || params.duenoId);

  // ── Manejadores ─────────────────────────────────────────────────────────────
  const handleCreate = () => setModal({ type: 'create' });

  const handleEdit = (m: MascotaResponse) => {
    setModal({ type: 'edit', mascota: m });
  };

  const handleDeleteIntent = (m: MascotaResponse) => {
    setModal({ type: 'delete', mascota: m });
  };

  const handleCloseModal = () => {
    const prevType = modal.type;
    setModal({ type: 'none' });
    if (prevType === 'create') createBtnRef.current?.focus();
    else if (prevType === 'edit') lastEditTriggerRef.current?.focus();
    else if (prevType === 'delete') lastDeleteTriggerRef.current?.focus();
  };

  const handleOpenCitas = async (m: MascotaResponse) => {
    setCitasModalMascota(m);
    setLoadingCitas(true);
    setErrorCitas(null);
    try {
      const res = await getCitas({ mascotaId: m.id, page: 1, pageSize: 100 });
      setCitasList(res.items);
    } catch {
      setErrorCitas('Error al cargar las citas médicas de la mascota.');
    } finally {
      setLoadingCitas(false);
    }
  };

  const handleOpenTratamientos = async (m: MascotaResponse) => {
    setTratamientosModalMascota(m);
    setLoadingTratamientos(true);
    setErrorTratamientos(null);
    try {
      const res = await getTratamientosByMascota(m.id);
      setTratamientosList(res);
    } catch {
      setErrorTratamientos('Error al cargar los tratamientos médicos.');
    } finally {
      setLoadingTratamientos(false);
    }
  };

  // ── Escape para cerrar cualquier modal ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modal.type !== 'none') handleCloseModal();
        if (citasModalMascota) setCitasModalMascota(null);
        if (tratamientosModalMascota) setTratamientosModalMascota(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal.type, citasModalMascota, tratamientosModalMascota]);

  const handleFormSubmit = async (values: MascotaFormValues) => {
    let success: MascotaResponse | null = null;
    if (modal.type === 'create') {
      success = await create(values);
    } else if (modal.type === 'edit') {
      success = await update(modal.mascota.id, values);
    }
    if (success) handleCloseModal();
  };

  const handleDeleteConfirm = async () => {
    if (modal.type !== 'delete') return;
    const ok = await remove(modal.mascota.id);
    if (ok) handleCloseModal();
  };

  const handleEspecieFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyFilters({ especie: e.target.value || undefined });
  };

  const handleFormOverlayClose = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) handleCloseModal();
  };

  return (
    <div className={styles.page}>
      {/* ── Encabezado de página ─────────────────────────────────────────── */}
      <header className={styles.pageHeader}>
        <div>
          <div className={styles.badgePill}>
            <span className={styles.badgeDot} />
            <span>Portal Clínico</span>
          </div>
          <h1 className={styles.pageTitle}>
            {isAdminOrVet ? 'Registro de Mascotas' : 'Mis Mascotas'}
          </h1>
          <p
            className={styles.pageSubtitle}
            aria-live="polite"
            aria-atomic="true"
          >
            {list.data && !list.loading
              ? `${list.data.totalCount} paciente${list.data.totalCount !== 1 ? 's' : ''} registrado${list.data.totalCount !== 1 ? 's' : ''} en el sistema`
              : 'Cargando pacientes...'}
          </p>
        </div>
        {/* Solo Admin y Veterinario pueden inscribir nuevas mascotas */}
        {isAdminOrVet && (
          <button
            ref={createBtnRef}
            id="create-mascota-btn"
            type="button"
            className={styles.btnNew}
            onClick={handleCreate}
            aria-haspopup="dialog"
          >
            <PlusIcon size={16} /> Nueva mascota
          </button>
        )}
      </header>

      {/* ── Filtros ────────────────────────────────────────────────────────── */}
      <search aria-label="Filtros de mascotas">
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <FilterIcon size={15} className={styles.filterIcon} />
            <label htmlFor="filter-especie" className={styles.filterLabel}>
              Filtrar por especie:
            </label>
            <select
              id="filter-especie"
              className={styles.filterSelect}
              value={params.especie ?? ''}
              onChange={handleEspecieFilter}
              aria-label="Seleccionar especie para filtrar"
            >
              <option value="">Todas las especies</option>
              {ESPECIES_VALIDAS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>
      </search>

      {/* ── Grid de mascotas ─────────────────────────────────────────────── */}
      <section aria-label="Listado de mascotas" aria-live="polite">
        {list.loading && (
          <div
            className={styles.grid}
            aria-busy="true"
            aria-label="Cargando mascotas, por favor espera"
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <MascotaCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!list.loading && list.error && (
          <ErrorState message={list.error} onRetry={refetch} />
        )}

        {!list.loading && !list.error && list.data?.items.length === 0 && (
          <EmptyState filtered={isFiltered} />
        )}

        {!list.loading && !list.error && (list.data?.items.length ?? 0) > 0 && (
          <div className={styles.grid}>
            {list.data!.items.map((m) => (
              <MascotaCard
                key={m.id}
                mascota={m}
                isAdminOrVet={isAdminOrVet}
                isAdmin={isAdmin}
                onEdit={(mascota) => handleEdit(mascota)}
                onDelete={(mascota) => {
                  const btn = document.getElementById(`delete-mascota-${mascota.id}`) as HTMLButtonElement;
                  (lastDeleteTriggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = btn;
                  handleDeleteIntent(mascota);
                }}
                onViewCitas={(mascota) => handleOpenCitas(mascota)}
                onViewTratamientos={(mascota) => handleOpenTratamientos(mascota)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Paginación ──────────────────────────────────────────────────────── */}
      {list.data && (
        <Paginator
          page={list.data.page}
          totalPages={list.data.totalPages}
          hasNext={list.data.hasNextPage}
          hasPrev={list.data.hasPreviousPage}
          onPage={goToPage}
        />
      )}

      {/* ── Modal de formulario (crear / editar) ─────────────────────────── */}
      {(modal.type === 'create' || modal.type === 'edit') && (
        <div
          className={styles.formOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={modal.type === 'create' ? 'Crear mascota' : `Editar ${(modal as { mascota: MascotaResponse }).mascota?.nombre ?? 'mascota'}`}
          onClick={handleFormOverlayClose}
        >
          <div
            ref={formModalRef}
            className={styles.formModal}
          >
            <MascotaForm
              initialData={modal.type === 'edit' ? modal.mascota : undefined}
              serverFieldErrors={mutation.fieldErrors}
              serverError={mutation.error}
              isSubmitting={mutation.loading}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
            />
          </div>
        </div>
      )}

      {/* ── Modal de eliminación ────────────────────────────────────────────── */}
      <DeleteModal
        isOpen={modal.type === 'delete'}
        itemName={modal.type === 'delete' ? modal.mascota.nombre : ''}
        isDeleting={mutation.loading}
        error={mutation.error}
        onConfirm={handleDeleteConfirm}
        onCancel={handleCloseModal}
        triggerRef={lastDeleteTriggerRef as React.RefObject<HTMLButtonElement>}
      />

      {/* ── Modal de Citas de Mascota (Para Cliente) ────────────────────── */}
      {citasModalMascota && (
        <div
          className={styles.formOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Citas médicas de ${citasModalMascota.nombre}`}
          onClick={(e) => { if (e.target === e.currentTarget) setCitasModalMascota(null); }}
        >
          <div className={styles.detailModal}>
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.modalBadge}>
                  <CalendarIcon size={13} />
                  <span>Historial de Citas</span>
                </div>
                <h2 className={styles.detailTitle}>
                  {citasModalMascota.nombre}
                </h2>
                <p className={styles.detailSub}>
                  Paciente: {citasModalMascota.especie} &bull; Consultas agendadas
                </p>
              </div>
              <button
                type="button"
                className={styles.btnClose}
                onClick={() => setCitasModalMascota(null)}
                aria-label="Cerrar modal"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className={styles.detailBody}>
              {loadingCitas && (
                <div className={styles.centerState}>
                  <p>Cargando citas médicas...</p>
                </div>
              )}

              {!loadingCitas && errorCitas && (
                <div className={styles.alertError}>
                  {errorCitas}
                </div>
              )}

              {!loadingCitas && !errorCitas && citasList.length === 0 && (
                <div className={styles.centerState}>
                  <CalendarIcon size={36} className={styles.mutedIcon} />
                  <p>No hay citas médicas registradas para {citasModalMascota.nombre}.</p>
                </div>
              )}

              {!loadingCitas && !errorCitas && citasList.map((c) => (
                <div key={c.id} className={styles.itemCard}>
                  <div className={styles.itemRow}>
                    <span className={styles.itemTitle}>{formatFecha(c.fecha)}</span>
                    <span className={styles.itemCosto}>{formatCLP(c.costoTotalTratamientos)}</span>
                  </div>
                  <div className={styles.itemSub}>
                    <strong>Motivo:</strong> {c.motivo}
                  </div>
                  <div className={styles.badgeTratRow}>
                    <span className={styles.pillBadge}>
                      <PillIcon size={12} />
                      {c.totalTratamientos} {c.totalTratamientos === 1 ? 'tratamiento' : 'tratamientos'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.detailFooter}>
              <span className={styles.totalText}>
                Total de citas: <strong>{citasList.length}</strong>
              </span>
              <button
                type="button"
                className={styles.btnCloseModal}
                onClick={() => setCitasModalMascota(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Tratamientos de Mascota (Para Cliente) ─────────────── */}
      {tratamientosModalMascota && (
        <div
          className={styles.formOverlay}
          role="dialog"
          aria-modal="true"
          aria-label={`Tratamientos de ${tratamientosModalMascota.nombre}`}
          onClick={(e) => { if (e.target === e.currentTarget) setTratamientosModalMascota(null); }}
        >
          <div className={styles.detailModal}>
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.modalBadgeEmerald}>
                  <PillIcon size={13} />
                  <span>Tratamientos y Recetas</span>
                </div>
                <h2 className={styles.detailTitle}>
                  {tratamientosModalMascota.nombre}
                </h2>
                <p className={styles.detailSub}>
                  Medicamentos y procedimientos clínicos registrados
                </p>
              </div>
              <button
                type="button"
                className={styles.btnClose}
                onClick={() => setTratamientosModalMascota(null)}
                aria-label="Cerrar modal"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className={styles.detailBody}>
              {loadingTratamientos && (
                <div className={styles.centerState}>
                  <p>Cargando tratamientos...</p>
                </div>
              )}

              {!loadingTratamientos && errorTratamientos && (
                <div className={styles.alertError}>
                  {errorTratamientos}
                </div>
              )}

              {!loadingTratamientos && !errorTratamientos && tratamientosList.length === 0 && (
                <div className={styles.centerState}>
                  <PillIcon size={36} className={styles.mutedIcon} />
                  <p>No hay tratamientos registrados para {tratamientosModalMascota.nombre} aún.</p>
                </div>
              )}

              {!loadingTratamientos && !errorTratamientos && tratamientosList.map((t, idx) => (
                <div key={t.id} className={styles.itemCard}>
                  <div className={styles.itemRow}>
                    <span className={styles.itemTitle}>
                      <span className={styles.indexTag}>#{idx + 1}</span>
                      {t.descripcion}
                    </span>
                    <span className={styles.itemCostoEmerald}>{formatCLP(t.costo)}</span>
                  </div>
                  <div className={styles.itemSub}>
                    Fecha de atención: {formatFecha(t.fechaCita)}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.detailFooter}>
              <div>
                <span className={styles.totalText}>Total acumulado: </span>
                <span className={styles.totalMontoEmerald}>
                  {formatCLP(tratamientosList.reduce((acc, t) => acc + t.costo, 0))}
                </span>
              </div>
              <button
                type="button"
                className={styles.btnCloseModal}
                onClick={() => setTratamientosModalMascota(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
