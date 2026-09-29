import { Link, useNavigate } from 'react-router-dom';
import { ShieldIcon } from '../components/common/Icons';
import styles from './UnauthorizedPage.module.css';

/**
 * Página de acceso denegado (403).
 * Mostrada por ProtectedRoute cuando el usuario está autenticado
 * pero no tiene el rol requerido para acceder a la ruta solicitada.
 */
export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconBox} aria-hidden="true">
          <ShieldIcon size={32} />
        </div>
        <span className={styles.code} aria-hidden="true">Error 403</span>
        <h1 className={styles.title}>Acceso Denegado</h1>
        <p className={styles.desc}>
          No cuentas con los permisos requeridos para acceder a este módulo.
          Si crees que esto es un error, consulta con el Administrador de la clínica.
        </p>
        <div className={styles.actions}>
          <button
            id="unauthorized-back"
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate(-1)}
          >
            ← Volver
          </button>
          <Link to="/" className={styles.btnPrimary} id="unauthorized-home">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
