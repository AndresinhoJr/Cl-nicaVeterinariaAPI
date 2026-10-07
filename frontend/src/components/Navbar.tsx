import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cambiarPassword } from '../services/auth.service';
import { isApiError } from '../api/axiosClient';
import { ClinicLogoIcon, KeyIcon, LogOutIcon, SettingsIcon, CloseIcon, AlertIcon } from './common/Icons';
import styles from './Navbar.module.css';

/** Colores y etiquetas según rol (Tailwind palette) */
const ROL_CONFIG = {
  Admin:       { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Admin' },
  Veterinario: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'Veterinario' },
  Cliente:     { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', label: 'Cliente' },
} as const;

/**
 * Barra de navegación principal.
 * - Muestra el rol del usuario con color diferenciado.
 * - Oculta el enlace /admin para roles sin permiso.
 * - Botón de cambio de contraseña personal.
 * - Botón de logout que llama a AuthContext.logout().
 */
export function Navbar() {
  const { session, logout, hasRole } = useAuth();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [actualPass, setActualPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);
  const [errorPass, setErrorPass] = useState<string | null>(null);
  const [successPass, setSuccessPass] = useState(false);

  const rolConfig = session ? ROL_CONFIG[session.rol] : null;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPass(null);
    setSuccessPass(false);

    if (!actualPass || !newPass || !confirmPass) {
      setErrorPass('Todos los campos son obligatorios.');
      return;
    }

    if (newPass.length < 4) {
      setErrorPass('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPass !== confirmPass) {
      setErrorPass('La confirmación de la contraseña no coincide.');
      return;
    }

    setLoadingPass(true);
    try {
      await cambiarPassword({ passwordActual: actualPass, nuevoPassword: newPass });
      setSuccessPass(true);
      setActualPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setSuccessPass(false);
      }, 1500);
    } catch (err) {
      if (isApiError(err)) {
        setErrorPass(err.message);
      } else {
        setErrorPass('No se pudo cambiar la contraseña.');
      }
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <>
      <nav className={styles.nav} role="navigation" aria-label="Navegación principal">
        {/* Logo */}
        <Link to="/" className={styles.brand} aria-label="Inicio">
          <ClinicLogoIcon size={30} />
          <span className={styles.brandName}>Clínica Veterinaria</span>
        </Link>

        {/* Links */}
        <ul className={styles.links} role="list">
          <li>
            <NavLink to="/mascotas" className={navLinkClass}>
              {hasRole('Admin', 'Veterinario') ? 'Mascotas' : 'Mis Mascotas'}
            </NavLink>
          </li>
          {/* Solo Admin y Veterinario ven la agenda global de citas y tratamientos */}
          {hasRole('Admin', 'Veterinario') && (
            <>
              <li>
                <NavLink to="/citas" className={navLinkClass}>
                  Citas
                </NavLink>
              </li>
              <li>
                <NavLink to="/tratamientos" className={navLinkClass}>
                  Tratamientos
                </NavLink>
              </li>
            </>
          )}
          {/* Solo Admin ve el panel de administración */}
          {hasRole('Admin') && (
            <li>
              <NavLink to="/admin" className={navLinkClass}>
                <SettingsIcon size={14} style={{ marginRight: 6 }} />
                Admin
              </NavLink>
            </li>
          )}
        </ul>

        {/* Usuario + Acciones */}
        <div className={styles.userArea}>
          {session && rolConfig && (
            <div className={styles.userInfo}>
              <span
                className={styles.roleBadge}
                style={{ color: rolConfig.color, background: rolConfig.bg }}
                aria-label={`Rol: ${rolConfig.label}`}
              >
                {rolConfig.label}
              </span>
              <span className={styles.userName} title={session.email}>
                {session.nombreUsuario}
              </span>
            </div>
          )}

          <button
            type="button"
            className={styles.btnIconAction}
            onClick={() => { setShowPasswordModal(true); setErrorPass(null); setSuccessPass(false); }}
            title="Cambiar contraseña personal"
            aria-label="Cambiar mi contraseña"
          >
            <KeyIcon size={16} />
          </button>

          <button
            id="logout-btn"
            type="button"
            className={styles.btnLogout}
            onClick={logout}
            aria-label="Cerrar sesión"
          >
            <LogOutIcon size={14} style={{ marginRight: 5 }} />
            Salir
          </button>
        </div>
      </nav>

      {/* Modal de cambio de contraseña */}
      {showPasswordModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Cambiar contraseña"
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '1.75rem',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <KeyIcon size={18} />
                </div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>
                  Cambiar Contraseña
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}
                aria-label="Cerrar modal"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Actualiza tu clave de acceso personal.
            </p>

            {errorPass && (
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
                <span>{errorPass}</span>
              </div>
            )}

            {successPass && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.25)',
                color: '#34d399',
                padding: '0.65rem 0.9rem',
                borderRadius: '10px',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
                fontWeight: 600
              }}>
                <span>Contraseña actualizada exitosamente.</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Contraseña actual *
                </label>
                <input
                  type="password"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(30, 41, 59, 0.6)',
                    color: '#f8fafc',
                    boxSizing: 'border-box',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  value={actualPass}
                  onChange={(e) => setActualPass(e.target.value)}
                  placeholder="Tu clave actual..."
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Nueva contraseña *
                </label>
                <input
                  type="password"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(30, 41, 59, 0.6)',
                    color: '#f8fafc',
                    boxSizing: 'border-box',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Mínimo 4 caracteres..."
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Confirmar nueva contraseña *
                </label>
                <input
                  type="password"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(30, 41, 59, 0.6)',
                    color: '#f8fafc',
                    boxSizing: 'border-box',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Repite la nueva clave..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'transparent',
                    color: '#94a3b8',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowPasswordModal(false)}
                  disabled={loadingPass}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.65rem 1.4rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  }}
                  disabled={loadingPass || successPass}
                >
                  {loadingPass ? 'Guardando...' : 'Cambiar clave'}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
