import { useEffect, useRef } from 'react';
import { TrashIcon, AlertIcon } from '../../components/common/Icons';
import styles from './DeleteModal.module.css';

interface DeleteModalProps {
  isOpen: boolean;
  itemName: string;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  /** ref del botón que abrió el modal — para restaurar el foco al cerrar */
  triggerRef?: React.RefObject<HTMLButtonElement>;
}

export function DeleteModal({
  isOpen,
  itemName,
  isDeleting,
  error,
  onConfirm,
  onCancel,
  triggerRef,
}: DeleteModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => cancelRef.current?.focus(), 50);
      return () => clearTimeout(id);
    } else {
      triggerRef?.current?.focus();
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      aria-hidden="false"
    >
      <div
        ref={containerRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-desc"
        className={styles.modal}
      >
        <div className={styles.iconWrap} aria-hidden="true">
          <TrashIcon size={26} />
        </div>

        <h2 id="delete-modal-title" className={styles.title}>
          Eliminar Mascota
        </h2>
        <p id="delete-modal-desc" className={styles.desc}>
          ¿Estás seguro de que quieres eliminar a{' '}
          <strong className={styles.name}>{itemName}</strong>? Esta acción no se puede deshacer y borrará su ficha médica.
        </p>

        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className={styles.errorRegion}
        >
          {error && (
            <p className={styles.error}>
              <AlertIcon size={16} />
              <span>{error}</span>
            </p>
          )}
        </div>

        <div className={styles.actions}>
          <button
            ref={cancelRef}
            id="delete-modal-cancel"
            type="button"
            className={styles.btnCancel}
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            id="delete-modal-confirm"
            type="button"
            className={styles.btnDelete}
            onClick={onConfirm}
            disabled={isDeleting}
            aria-busy={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                <span>Eliminando...</span>
              </>
            ) : (
              'Sí, eliminar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
