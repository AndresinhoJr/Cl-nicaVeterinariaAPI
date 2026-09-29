import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import './index.css';

// ─── Lazy-loading de páginas ──────────────────────────────────────────────────
// Cada ruta se carga solo cuando el usuario la visita, reduciendo el bundle inicial.
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const RegisterPage     = lazy(() => import('./pages/RegisterPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));
const AdminPage        = lazy(() => import('./pages/AdminPage'));

// Vistas de features (se importan directamente para las más usadas)
import { MascotaList } from './features/mascotas/MascotaList';
import { CitaList } from './features/citas/CitaList';
import { TratamientoList } from './features/tratamientos/TratamientoList';

// ─── Spinner de carga para lazy routes ────────────────────────────────────────
function PageSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', color: 'var(--cv-text-muted)', fontSize: '0.9rem'
    }}>
      Cargando...
    </div>
  );
}

// ─── Árbol de rutas ───────────────────────────────────────────────────────────
/**
 * Estructura de rutas:
 *
 * /login                    → público — LoginPage
 * /unauthorized             → público — UnauthorizedPage (403)
 *
 * /                         → ProtectedRoute (cualquier rol autenticado)
 *   /                       → redirect a /mascotas
 *   /mascotas               → MascotaList   [Admin, Veterinario, Cliente]
 *   /citas                  → (próximamente CitaList)
 *
 *   /tratamientos           → ProtectedRoute [Admin, Veterinario]
 *   /admin                  → ProtectedRoute [Admin]  → AdminPage
 *
 * *                         → redirect a /  (404 → home)
 */
function AppRoutes() {
  return (
    <Routes>
      {/* ── Rutas públicas ─────────────────────────────────────────────── */}
      <Route path="/login"        element={<LoginPage />} />
      <Route path="/registro"     element={<Navigate to="/login" replace />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* ── Rutas protegidas: cualquier usuario autenticado ─────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthLayout />}>

          {/* Redirect de raíz */}
          <Route index element={<Navigate to="/mascotas" replace />} />

          {/* Mascotas: todos los roles */}
          <Route path="/mascotas" element={<MascotaList />} />

          {/* ── Sub-árbol: Solo Admin y Veterinario ──────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Veterinario']} />}>
            <Route path="/citas" element={<CitaList />} />
            <Route path="/tratamientos" element={<TratamientoList />} />
          </Route>

          {/* ── Sub-árbol: Solo Admin ────────────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

        </Route>
      </Route>

      {/* ── Catch-all: ruta desconocida → home ─────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─── Raíz de la aplicación ────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      {/*
        AuthProvider DEBE estar dentro de BrowserRouter
        para poder usar useNavigate() internamente.
      */}
      <AuthProvider>
        <Suspense fallback={<PageSpinner />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
