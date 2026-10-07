import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mascotaSchema, type MascotaFormValues } from './mascota.schema';
import { ESPECIES_VALIDAS } from '../../types/mascota.types';
import type { MascotaResponse } from '../../types/mascota.types';
import { useAuth } from '../../context/AuthContext';
import { getClientes, crearCliente, type ClienteSummary } from '../../services/auth.service';
import { isApiError } from '../../api/axiosClient';
import { EditIcon, PlusIcon, AlertIcon, CloseIcon } from '../../components/common/Icons';
import styles from './MascotaForm.module.css';

interface MascotaFormProps {
  initialData?: MascotaResponse;
  serverFieldErrors?: Record<string, string[]> | null;
  serverError?: string | null;
  isSubmitting: boolean;
  onSubmit: (values: MascotaFormValues) => void;
  onCancel: () => void;
}

/**
 * Formulario reutilizable crear/editar mascotas.
 *
 * WCAG 2.2 AA:
 * - 1.3.1 Info & Relationships: label explícito para cada campo
 * - 1.3.5 Identify Input Purpose: autocomplete en campos relevantes
 * - 3.3.1 Error Identification: aria-describedby siempre apunta al contenedor de error
 * - 3.3.2 Labels or Instructions: texto de ayuda via aria-describedby + id estático
 * - 4.1.3 Status Messages: aria-live="polite" anuncia estado del envío
 */
export function MascotaForm({
  initialData,
  serverFieldErrors,
  serverError,
  isSubmitting,
  onSubmit,
  onCancel,
}: MascotaFormProps) {
  const isEditing = Boolean(initialData);
  const { hasRole } = useAuth();
  const isAdminOrVet = hasRole('Admin', 'Veterinario');

  const [clientes, setClientes] = useState<ClienteSummary[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);

  // Modal para inscribir nuevo cliente al instante
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPass, setNewClientPass] = useState('cliente123');
  const [newClientLoading, setNewClientLoading] = useState(false);
  const [newClientError, setNewClientError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdminOrVet) {
      setLoadingClientes(true);
      getClientes()
        .then(setClientes)
        .catch(() => {})
        .finally(() => setLoadingClientes(false));
    }
  }, [isAdminOrVet]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isDirty },
  } = useForm<MascotaFormValues>({
    resolver: zodResolver(mascotaSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: initialData
      ? {
          nombre: initialData.nombre,
          especie: initialData.especie as MascotaFormValues['especie'],
          duenoId: initialData.duenoId,
        }
      : { nombre: '', especie: undefined, duenoId: undefined },
  });

  // Sincronizar errores de campo del servidor con React Hook Form
  useEffect(() => {
    if (!serverFieldErrors) return;
    const fieldMap: Record<string, keyof MascotaFormValues> = {
      Nombre: 'nombre',
      Especie: 'especie',
      DuenoId: 'duenoId',
    };
    Object.entries(serverFieldErrors).forEach(([backendField, messages]) => {
      const rhfField = fieldMap[backendField];
      if (rhfField) {
        setError(rhfField, { type: 'server', message: messages[0] });
      }
    });
  }, [serverFieldErrors, setError]);

  // Reset al cambiar el item en edición
  useEffect(() => {
    if (initialData) {
      reset({
        nombre: initialData.nombre,
        especie: initialData.especie as MascotaFormValues['especie'],
        duenoId: initialData.duenoId,
      });
    } else {
      reset({ nombre: '', especie: undefined, duenoId: null });
    }
  }, [initialData, reset]);

  const handleQuickClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientEmail.trim()) {
      setNewClientError('Nombre y correo electrónico son obligatorios.');
      return;
    }
    setNewClientLoading(true);
    setNewClientError(null);
    try {
      const nuevo = await crearCliente({
        nombre: newClientName.trim(),
        email: newClientEmail.trim(),
        password: newClientPass.trim() || 'cliente123',
      });
      // Agregar a la lista y auto-seleccionar
      setClientes((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setValue('duenoId', nuevo.id, { shouldValidate: true, shouldDirty: true });
      setShowNewClientModal(false);
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPass('cliente123');
    } catch (err) {
      if (isApiError(err)) {
        setNewClientError(err.message);
      } else {
        setNewClientError('No se pudo registrar el cliente.');
      }
    } finally {
      setNewClientLoading(false);
    }
  };

  const handleFormSubmit = (values: MascotaFormValues) => {
    if (isAdminOrVet && (!values.duenoId || values.duenoId <= 0)) {
      setError('duenoId', {
        type: 'manual',
        message: 'Debes seleccionar un cliente (dueño) para la mascota.',
      });
      return;
    }
    onSubmit(values);
  };

  return (
    <form
      id="mascota-form"
      className={styles.form}
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      aria-label={isEditing ? 'Editar mascota' : 'Nueva mascota'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
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
          {isEditing ? <EditIcon size={16} /> : <PlusIcon size={16} />}
        </div>
        <h2 className={styles.title}>
          {isEditing ? 'Editar Mascota' : 'Nueva Mascota'}
        </h2>
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
      >
        {isSubmitting
          ? (isEditing ? 'Guardando cambios...' : 'Creando mascota...')
          : ''}
      </div>

      {serverError && !serverFieldErrors && (
        <div
          id="mascota-form-server-error"
          className={styles.serverError}
          role="alert"
          aria-live="assertive"
        >
          <span className={styles.errorIcon} aria-hidden="true">
            <AlertIcon size={16} />
          </span>
          {serverError}
        </div>
      )}

      {/* ── Campo: Nombre ─────────────────────────────────────────────────── */}
      <div className={styles.field}>
        <label htmlFor="mascota-nombre" className={styles.label}>
          Nombre <span className={styles.required} aria-label="obligatorio">*</span>
        </label>
        <input
          id="mascota-nombre"
          type="text"
          className={`${styles.input} ${errors.nombre ? styles.inputError : ''}`}
          placeholder="Ej. Fido, Luna, Max..."
          autoComplete="off"
          aria-describedby="mascota-nombre-err"
          aria-invalid={Boolean(errors.nombre)}
          aria-required="true"
          {...register('nombre')}
        />
        <p
          id="mascota-nombre-err"
          className={styles.fieldError}
          role="alert"
          aria-live="polite"
        >
          {errors.nombre?.message ?? ''}
        </p>
      </div>

      {/* ── Campo: Especie ────────────────────────────────────────────────── */}
      <div className={styles.field}>
        <label htmlFor="mascota-especie" className={styles.label}>
          Especie <span className={styles.required} aria-label="obligatorio">*</span>
        </label>
        <select
          id="mascota-especie"
          className={`${styles.select} ${errors.especie ? styles.inputError : ''}`}
          aria-describedby="mascota-especie-err"
          aria-invalid={Boolean(errors.especie)}
          aria-required="true"
          {...register('especie')}
        >
          <option value="">— Selecciona una especie —</option>
          {ESPECIES_VALIDAS.map((esp) => (
            <option key={esp} value={esp}>{esp}</option>
          ))}
        </select>
        <p
          id="mascota-especie-err"
          className={styles.fieldError}
          role="alert"
          aria-live="polite"
        >
          {errors.especie?.message ?? ''}
        </p>
      </div>

      {/* ── Campo: Dueño (Obligatorio para Veterinario y Admin) ─────────────── */}
      {isAdminOrVet && (
        <div className={styles.field}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="mascota-dueno" className={styles.label}>
              Dueño (Cliente) <span className={styles.required} aria-label="obligatorio">*</span>
            </label>
            <button
              type="button"
              id="btn-alta-cliente-rapida"
              onClick={() => { setShowNewClientModal(true); setNewClientError(null); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              + Inscribir nuevo cliente
            </button>
          </div>
          <select
            id="mascota-dueno"
            className={`${styles.select} ${errors.duenoId ? styles.inputError : ''}`}
            aria-describedby="mascota-dueno-hint mascota-dueno-err"
            aria-invalid={Boolean(errors.duenoId)}
            aria-required="true"
            {...register('duenoId', {
              setValueAs: (v) => {
                if (v === '' || v === undefined || v === null) return null;
                const n = Number(v);
                return isNaN(n) ? null : n;
              },
            })}
          >
            <option value="">
              {loadingClientes ? 'Cargando lista de clientes...' : '— Selecciona el cliente (dueño) —'}
            </option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.email})
              </option>
            ))}
          </select>
          <p id="mascota-dueno-hint" className={styles.fieldHint}>
            El cliente asignado podrá iniciar sesión y consultar el historial, citas y tratamientos de su mascota.
          </p>
          <p
            id="mascota-dueno-err"
            className={styles.fieldError}
            role="alert"
            aria-live="polite"
          >
            {errors.duenoId?.message ?? ''}
          </p>

          {/* Modal rápido para dar de alta nuevo cliente */}
          {showNewClientModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1.5rem',
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Registrar nuevo cliente"
            >
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '20px',
                  padding: '1.75rem',
                  maxWidth: '440px',
                  width: '100%',
                  boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>
                    Inscribir Nuevo Cliente
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNewClientModal(false)}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}
                    aria-label="Cerrar modal"
                  >
                    <CloseIcon size={18} />
                  </button>
                </div>
                <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  Ingresa los datos del dueño. Sus credenciales le permitirán acceder al portal de la clínica.
                </p>

                {newClientError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: '#fda4af',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '10px',
                    fontSize: '0.8125rem',
                    marginBottom: '1rem'
                  }}>
                    <AlertIcon size={16} />
                    <span>{newClientError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Ej. Roberto Muñoz"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      className={styles.input}
                      placeholder="roberto@gmail.com"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>
                      Contraseña inicial provisoria
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      value={newClientPass}
                      onChange={(e) => setNewClientPass(e.target.value)}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      El cliente podrá cambiarla al ingresar a su cuenta.
                    </span>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => setShowNewClientModal(false)}
                      disabled={newClientLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={handleQuickClientSubmit}
                      disabled={newClientLoading}
                    >
                      {newClientLoading ? 'Guardando...' : 'Crear y seleccionar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Acciones ─────────────────────────────────────────────────────── */}
      <div className={styles.actions}>
        <button
          type="button"
          id="mascota-form-cancel"
          className={styles.btnSecondary}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          id="mascota-form-submit"
          className={styles.btnPrimary}
          disabled={isSubmitting || (isEditing && !isDirty)}
          aria-busy={isSubmitting}
        >
          {isSubmitting && (
            <span className={styles.btnSpinner} aria-hidden="true" />
          )}
          {isSubmitting
            ? 'Guardando...'
            : isEditing
            ? 'Guardar cambios'
            : 'Crear mascota'}
        </button>
      </div>
    </form>
  );
}
