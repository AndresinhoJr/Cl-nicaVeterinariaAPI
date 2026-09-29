import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { isApiError } from '../api/axiosClient';
import { loginSchema, type LoginFormValues } from '../schemas/login.schema';
import { ClinicLogoIcon, ShieldIcon, AlertIcon } from '../components/common/Icons';
import styles from './LoginPage.module.css';

/**
 * Página de login. Conectada a AuthContext.login() que a su vez
 * llama al endpoint POST /api/v1/usuarios/login y guarda la sesión.
 */
export default function LoginPage() {
  const { login, loading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values);
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 401) {
          setServerError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
        } else if (err.status === 0) {
          setServerError('Sin conexión con el servidor. Verifica tu red.');
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className={styles.page}>
      {/* Panel de info (lado izquierdo) */}
      <aside className={styles.aside}>
        <div className={styles.asideContent}>
          <div className={styles.logoBox} aria-hidden="true">
            <ClinicLogoIcon size={34} />
          </div>
          <h1 className={styles.asideTitle}>
            Clínica Veterinaria <span className={styles.brandGradient}>Portal</span>
          </h1>
          <p className={styles.asideDesc}>
            Sistema integral de gestión de pacientes veterinarios, citas médicas y tratamientos clínicos con acceso protegido.
          </p>
          <div className={styles.rolesList}>
            <span className={styles.rolesBadge}>
              <span className={styles.roleDot} style={{ background: '#f59e0b' }} />
              Admin
            </span>
            <span className={styles.rolesBadge}>
              <span className={styles.roleDot} style={{ background: '#10b981' }} />
              Veterinario
            </span>
            <span className={styles.rolesBadge}>
              <span className={styles.roleDot} style={{ background: '#38bdf8' }} />
              Cliente
            </span>
          </div>
        </div>
      </aside>

      {/* Panel del formulario (lado derecho) */}
      <main className={styles.main}>
        <div className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Iniciar Sesión</h2>
            <p className={styles.cardSub}>Ingresa tus credenciales para acceder al portal</p>
          </header>

          {/* Alerta de error del servidor */}
          {serverError && (
            <div className={styles.alertError} role="alert" id="login-error-banner">
              <span className={styles.alertIcon}>
                <AlertIcon size={16} />
              </span>
              <span>{serverError}</span>
            </div>
          )}

          <form
            id="login-form"
            className={styles.form}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* Campo: Usuario / Email */}
            <div className={styles.field}>
              <label htmlFor="login-usuario" className={styles.label}>
                Usuario o correo electrónico
              </label>
              <input
                id="login-usuario"
                type="text"
                className={`${styles.input} ${errors.usuario ? styles.inputError : ''}`}
                placeholder="tu@email.com o usuario"
                autoComplete="username"
                aria-invalid={Boolean(errors.usuario)}
                aria-describedby={errors.usuario ? 'usuario-err' : undefined}
                {...register('usuario')}
              />
              {errors.usuario && (
                <p id="usuario-err" className={styles.fieldError} role="alert">
                  {errors.usuario.message}
                </p>
              )}
            </div>

            {/* Campo: Contraseña */}
            <div className={styles.field}>
              <label htmlFor="login-password" className={styles.label}>
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-err' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p id="password-err" className={styles.fieldError} role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              className={styles.btnSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  <span>Ingresando...</span>
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <footer className={styles.cardFooter}>
            <p>
              Los accesos de clientes son gestionados en recepción al atender a tu mascota. Si perteneces al equipo veterinario, contacta al Administrador.
            </p>
          </footer>
        </div>

        {/* Nota sobre almacenamiento del token */}
        <aside className={styles.tokenNote} role="note">
          <ShieldIcon size={16} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Almacenamiento seguro:</strong> El token de autenticación se almacena exclusivamente en <code>sessionStorage</code> durante tu sesión activa.
          </div>
        </aside>
      </main>
    </div>
  );
}
