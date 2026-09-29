import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  clearSession,
  getSession,
  login as svcLogin,
  logout as svcLogout,
  register as svcRegister,
} from '../services/auth.service';
import type { AuthSession, LoginRequest, RegisterRequest } from '../types/auth.types';

// ─── Tipos del contexto ────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Sesión activa. null = no autenticado. */
  session: AuthSession | null;
  /** true durante login / register */
  loading: boolean;
  /** Inicia sesión y actualiza el estado global. */
  login: (data: LoginRequest) => Promise<void>;
  /** Registra y autentica al usuario. */
  register: (data: RegisterRequest) => Promise<void>;
  /**
   * Cierra sesión: limpia sessionStorage, estado React y redirige a /login.
   * Punto único de verdad para logout — garantiza que no quede ningún rastro.
   */
  logout: () => void;
  /** true si hay sesión activa y no expirada */
  isAuthenticated: boolean;
  /** Comprueba si la sesión tiene uno de los roles dados */
  hasRole: (...roles: AuthSession['rol'][]) => boolean;
}

// ─── Contexto ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Envuelve toda la app. Provee estado de sesión global.
 * Debe colocarse DENTRO de <BrowserRouter> para poder usar useNavigate().
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  // Inicializar desde sessionStorage (persiste entre re-renders, no entre tabs)
  const [session, setSession] = useState<AuthSession | null>(() => getSession());
  const [loading, setLoading] = useState(false);

  // ── Logout centralizado ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    svcLogout();          // limpia sessionStorage (token + session)
    clearSession();       // doble seguro
    setSession(null);     // limpia estado React global
    navigate('/login', { replace: true });
  }, [navigate]);

  // ── Escuchar evento 'auth:unauthorized' del interceptor Axios ─────────────
  // Patrón: el interceptor (fuera del árbol React) dispara el evento,
  // el Provider (dentro del árbol) lo recibe y usa navigate() correctamente.
  const logoutRef = useRef(logout);
  logoutRef.current = logout; // siempre apunta a la versión más reciente

  useEffect(() => {
    const handleUnauthorized = () => {
      logoutRef.current(); // logout ya limpia storage + estado + redirige
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // ── Verificar expiración al enfocar la ventana ────────────────────────────
  useEffect(() => {
    const checkExpiry = () => {
      if (session && Date.now() > session.expiresAt) {
        logoutRef.current();
      }
    };
    window.addEventListener('focus', checkExpiry);
    return () => window.removeEventListener('focus', checkExpiry);
  }, [session]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (data: LoginRequest) => {
    setLoading(true);
    try {
      const newSession = await svcLogin(data);
      setSession(newSession);
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Registro ───────────────────────────────────────────────────────────────
  const register = useCallback(async (data: RegisterRequest) => {
    setLoading(true);
    try {
      const newSession = await svcRegister(data);
      setSession(newSession);
      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ── Helper de rol ──────────────────────────────────────────────────────────
  const hasRole = useCallback(
    (...roles: AuthSession['rol'][]) =>
      session !== null && roles.includes(session.rol),
    [session],
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        login,
        register,
        logout,
        isAuthenticated: session !== null,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Accede al contexto de autenticación desde cualquier componente.
 * Lanza error si se usa fuera de <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
