import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUsuarios, crearVeterinario, type UsuarioSummary } from '../services/auth.service';
import { isApiError } from '../api/axiosClient';
import {
  SettingsIcon,
  StethoscopeIcon,
  UserIcon,
  ShieldIcon,
  CloseIcon,
  AlertIcon
} from '../components/common/Icons';
import styles from './AdminPage.module.css';

const ROL_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Admin:       { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  Veterinario: { bg: '#d1fae5', color: '#047857', border: '#a7f3d0' },
  Cliente:     { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
};

export default function AdminPage() {
  const { session } = useAuth();

  const [usuarios, setUsuarios] = useState<UsuarioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtro de rol
  const [filtroRol, setFiltroRol] = useState<string>('Todos');

  // Modal para nuevo veterinario
  const [showModalVet, setShowModalVet] = useState(false);
  const [vetNombre, setVetNombre] = useState('');
  const [vetEmail, setVetEmail] = useState('');
  const [vetPass, setVetPass] = useState('vet123');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError('Error al cargar la lista de usuarios.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCrearVet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vetNombre.trim() || !vetEmail.trim()) {
      setModalError('Nombre y correo electrónico son obligatorios.');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      await crearVeterinario({
        nombre: vetNombre.trim(),
        email: vetEmail.trim(),
        password: vetPass.trim() || 'vet123',
      });
      setShowModalVet(false);
      setVetNombre('');
      setVetEmail('');
      setVetPass('vet123');
      await fetchUsuarios();
    } catch (err) {
      if (isApiError(err)) {
        setModalError(err.message);
      } else {
        setModalError('No se pudo registrar al veterinario.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const usuariosFiltrados = filtroRol === 'Todos'
    ? usuarios
    : usuarios.filter((u) => u.rol === filtroRol);

  const totalVets = usuarios.filter((u) => u.rol === 'Veterinario').length;
  const totalClientes = usuarios.filter((u) => u.rol === 'Cliente').length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.titleBadge}>
            <SettingsIcon size={13} />
            Módulo Administrativo
          </div>
          <h1 className={styles.title}>
            Panel de Control
          </h1>
          <p className={styles.sub}>
            Bienvenido, <strong>{session?.nombreUsuario}</strong>. Gestión de personal médico, cuentas y accesos.
          </p>
        </div>
        <button
          type="button"
          className={styles.btnNew}
          onClick={() => { setShowModalVet(true); setModalError(null); }}
        >
          <UserIcon size={16} />
          Registrar Veterinario
        </button>
      </header>

      {/* Métricas rápidas */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardIconBox} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
            <StethoscopeIcon size={22} />
          </div>
          <h2 className={styles.cardTitle}>Veterinarios</h2>
          <p className={styles.cardDesc}>{totalVets} profesionales en el equipo médico</p>
          <span className={styles.badge} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
            Activos
          </span>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIconBox} style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
            <UserIcon size={22} />
          </div>
          <h2 className={styles.cardTitle}>Clientes Inscritos</h2>
          <p className={styles.cardDesc}>{totalClientes} dueños de mascotas vinculados</p>
          <span className={styles.badge} style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
            Con portal activo
          </span>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIconBox} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            <ShieldIcon size={22} />
          </div>
          <h2 className={styles.cardTitle}>Seguridad del Sistema</h2>
          <p className={styles.cardDesc}>Registro público deshabilitado</p>
          <span className={styles.badge} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
            Alta por personal
          </span>
        </div>
      </div>

      {/* Sección de Usuarios */}
      <section className={styles.tableSection}>
        <div className={styles.tableToolbar}>
          <h2 className={styles.sectionTitle}>
            <UserIcon size={18} />
            Cuentas de Usuarios ({usuariosFiltrados.length})
          </h2>

          <div className={styles.filterGroup}>
            {['Todos', 'Veterinario', 'Cliente', 'Admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setFiltroRol(r)}
                className={`${styles.filterBtn} ${filtroRol === r ? styles.filterBtnActive : ''}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            <p>Cargando lista de usuarios...</p>
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            color: '#fda4af',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.875rem'
          }}>
            <AlertIcon size={16} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className={styles.tableWrapper}>
            <table className={styles.table} aria-label="Tabla de usuarios">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Correo Electrónico</th>
                  <th>Rol Asignado</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => {
                  const rolStyle = ROL_STYLE[u.rol] ?? { bg: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: 'rgba(255,255,255,0.1)' };
                  return (
                    <tr key={u.id}>
                      <td style={{ opacity: 0.5, fontVariantNumeric: 'tabular-nums' }}>#{u.id}</td>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>{u.nombre}</td>
                      <td style={{ color: '#94a3b8' }}>{u.email}</td>
                      <td>
                        <span
                          className={styles.roleBadge}
                          style={{
                            background: rolStyle.bg,
                            color: rolStyle.color,
                            border: `1px solid ${rolStyle.border}`,
                          }}
                        >
                          {u.rol}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Registrar Veterinario */}
      {showModalVet && (
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
          aria-label="Registrar nuevo veterinario"
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '1.75rem',
              maxWidth: '460px',
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
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <StethoscopeIcon size={18} />
                </div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>
                  Dar de Alta a Veterinario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModalVet(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}
                aria-label="Cerrar modal"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Crea las credenciales del profesional médico. Podrá acceder de forma inmediata a la clínica.
            </p>

            {modalError && (
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
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCrearVet} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Nombre y Apellido *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Dra. Sofia Morales"
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
                  value={vetNombre}
                  onChange={(e) => setVetNombre(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Correo electrónico institucional *
                </label>
                <input
                  type="email"
                  placeholder="sofia.morales@veterinaria.com"
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
                  value={vetEmail}
                  onChange={(e) => setVetEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Contraseña provisional
                </label>
                <input
                  type="text"
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
                  value={vetPass}
                  onChange={(e) => setVetPass(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  El veterinario podrá cambiar su clave desde la barra superior.
                </span>
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
                  onClick={() => setShowModalVet(false)}
                  disabled={modalLoading}
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
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Registrando...' : 'Registrar Veterinario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
