import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { isApiError } from '../api/axiosClient';
import { ClinicLogoIcon, AlertIcon } from '../components/common/Icons';
import styles from './LoginPage.module.css';

// ─── Schema de validación ─────────────────────────────────────────────────────
const registerSchema = z
  .object({
    nombre: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(100, 'El nombre no puede superar 100 caracteres.'),
    email: z
      .string()
      .email('Ingresa un correo electrónico válido.')
      .min(1, 'El correo es obligatorio.'),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmar: z
      .string()
      .min(1, 'Debes confirmar la contraseña.'),
  })
  .refine((data) => data.password === data.confirmar, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmar'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Componente ───────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerUser({ nombre: values.nombre, email: values.email, password: values.password });
      navigate('/mascotas', { replace: true });
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 400) {
          setServerError('El correo ya está registrado o los datos son inválidos.');
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
      {/* Panel de info */}
      <aside className={styles.aside}>
        <div className={styles.asideContent}>
          <div className={styles.logoBox} aria-hidden="true">
            <ClinicLogoIcon size={34} />
          </div>
          <h1 className={styles.asideTitle}>
            Clínica Veterinaria <span className={styles.brandGradient}>Portal</span>
          </h1>
          <p className={styles.asideDesc}>
            Crea tu cuenta de cliente y gestiona las citas y fichas médicas de tus mascotas en un solo lugar.
          </p>
          <div className={styles.rolesList}>
            <span className={styles.rolesBadge}>
              <span className={styles.roleDot} style={{ background: '#38bdf8' }} />
              Registro de Paciente / Dueño
            </span>
          </div>
        </div>
      </aside>

      {/* Formulario */}
      <main className={styles.main}>
        <div className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Crear Cuenta</h2>
            <p className={styles.cardSub}>Completa tus datos para registrarte como cliente</p>
          </header>

          {serverError && (
            <div className={styles.alertError} role="alert" id="register-error-banner">
              <span className={styles.alertIcon}>
                <AlertIcon size={16} />
              </span>
              <span>{serverError}</span>
            </div>
          )}

          <form
            id="register-form"
            className={styles.form}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* Nombre */}
            <div className={styles.field}>
              <label htmlFor="register-nombre" className={styles.label}>
                Nombre completo
              </label>
              <input
                id="register-nombre"
                type="text"
                className={`${styles.input} ${errors.nombre ? styles.inputError : ''}`}
                placeholder="Ej. María González"
                autoComplete="name"
                aria-invalid={Boolean(errors.nombre)}
                aria-describedby={errors.nombre ? 'nombre-err' : undefined}
                {...register('nombre')}
              />
              {errors.nombre && (
                <p id="nombre-err" className={styles.fieldError} role="alert">
                  {errors.nombre.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className={styles.field}>
              <label htmlFor="register-email" className={styles.label}>
                Correo electrónico
              </label>
              <input
                id="register-email"
                type="email"
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                placeholder="tu@email.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-err' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-err" className={styles.fieldError} role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div className={styles.field}>
              <label htmlFor="register-password" className={styles.label}>
                Contraseña
              </label>
              <input
                id="register-password"
                type="password"
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
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

            {/* Confirmar contraseña */}
            <div className={styles.field}>
              <label htmlFor="register-confirmar" className={styles.label}>
                Confirmar contraseña
              </label>
              <input
                id="register-confirmar"
                type="password"
                className={`${styles.input} ${errors.confirmar ? styles.inputError : ''}`}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmar)}
                aria-describedby={errors.confirmar ? 'confirmar-err' : undefined}
                {...register('confirmar')}
              />
              {errors.confirmar && (
                <p id="confirmar-err" className={styles.fieldError} role="alert">
                  {errors.confirmar.message}
                </p>
              )}
            </div>

            <button
              id="register-submit"
              type="submit"
              className={styles.btnSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  <span>Registrando...</span>
                </>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <footer className={styles.cardFooter}>
            <p>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
                Inicia sesión aquí
              </Link>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
