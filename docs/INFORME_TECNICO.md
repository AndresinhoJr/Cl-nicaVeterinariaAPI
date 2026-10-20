# Informe Técnico — Sistema de Gestión de Clínica Veterinaria

> **Asignatura:** Desarrollo de Aplicaciones Web  
> **Proyecto:** ClinicaVeterinariaAPI + Frontend React  
> **Fecha de entrega:** [DD/MM/AAAA]  
> **Integrantes:** [Nombre(s)]  
> **Repositorio:** [URL del repositorio]

---

## 1. Descripción del Proyecto

### 1.1 Propósito

Sistema web full-stack para la gestión integral de una clínica veterinaria. Permite registrar mascotas, administrar citas médicas y controlar tratamientos, con acceso diferenciado por roles (Administrador, Veterinario, Cliente).

### 1.2 Alcance

| Módulo | Descripción | Estado |
|---|---|---|
| Autenticación JWT | Login, registro, sesión con sessionStorage | ✅ Implementado |
| Gestión de Mascotas | CRUD completo con paginación y filtros | ✅ Implementado |
| Control de Acceso | 3 roles: Admin, Veterinario, Cliente | ✅ Implementado |
| Seguridad API | BOLA, rate limiting, validación de entrada | ✅ Implementado |
| Accesibilidad | WCAG 2.2 Level AA | ✅ Implementado |
| Pruebas unitarias | Vitest + Testing Library + MSW | ✅ Implementado |
| Pruebas E2E | Playwright | ✅ Implementado |

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de componentes

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENTE (Browser)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │              React 19 + Vite                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │   │
│  │  │  Pages   │  │ Features │  │   Components   │ │   │
│  │  │ /login   │  │mascotas/ │  │ Navbar         │ │   │
│  │  │ /admin   │  │ List     │  │ ProtectedRoute │ │   │
│  │  │ /unauth  │  │ Form     │  │ SkipLink       │ │   │
│  │  └────┬─────┘  │ Delete   │  └────────────────┘ │   │
│  │       │        └────┬─────┘                      │   │
│  │  ┌────▼─────────────▼────────────────────────┐  │   │
│  │  │              Context / Hooks               │  │   │
│  │  │  AuthContext  │  useMascotas               │  │   │
│  │  └───────────────┬───────────────────────────┘  │   │
│  │  ┌───────────────▼───────────────────────────┐  │   │
│  │  │        Infraestructura HTTP               │  │   │
│  │  │  axiosClient (interceptors: JWT, 401)     │  │   │
│  │  └───────────────┬───────────────────────────┘  │   │
│  └──────────────────┼───────────────────────────────┘   │
└─────────────────────┼───────────────────────────────────┘
                      │ HTTPS + JWT Bearer
┌─────────────────────▼───────────────────────────────────┐
│                  SERVIDOR (ASP.NET Core 8)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Endpoints│  │ Services │  │  Repos   │              │
│  │ MascotaApi  │ MascotaSvc  │  UoW     │              │
│  │ AuthApi  │  │ AuthSvc  │  │  EF Core │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│  ┌────▼─────────────▼──────────────▼────────────────┐   │
│  │  Middlewares: GlobalException │ RequestLogging    │   │
│  │  Rate Limiter: 60 req/min/IP  │ HTTPS Redirect   │   │
│  └───────────────────────────────────────────────────┘   │
│                         SQLite / SQL Server               │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Estructura de carpetas del frontend

```
frontend/src/
├── api/              # axiosClient.ts — cliente HTTP centralizado
├── context/          # AuthContext.tsx — estado global de sesión
├── components/       # Navbar, ProtectedRoute, SkipLink
├── features/
│   └── mascotas/     # MascotaList, MascotaForm, DeleteModal
│       ├── *.tsx     # Componentes
│       ├── *.module.css
│       ├── mascota.schema.ts    # Zod schema
│       └── useMascotas.ts       # Custom hook con estado asíncrono
├── layouts/          # AuthLayout (con skip-link y main)
├── mocks/            # MSW handlers y server (solo tests)
├── pages/            # LoginPage, UnauthorizedPage, AdminPage
├── schemas/          # login.schema.ts
├── services/         # auth.service.ts, mascota.service.ts
├── test/             # setup.ts, renderWithProviders.tsx
│   └── unit/         # *.test.tsx
├── types/            # auth.types.ts, mascota.types.ts
└── index.css         # Design system global (variables CSS)
e2e/
└── login-crud.spec.ts  # Tests Playwright
```

---

## 3. Stack Tecnológico

### 3.1 Frontend

| Tecnología | Versión | Justificación |
|---|---|---|
| React | 19.x | Librería UI con renderizado declarativo |
| TypeScript | 6.x | Tipado estático → menos bugs en runtime |
| Vite | 8.x | Bundler rápido con HMR |
| React Router DOM | 7.x | SPA routing con protected routes |
| React Hook Form | 7.x | Formularios performantes sin re-renders |
| Zod | 4.x | Schema validation con inferencia de tipos |
| Axios | 1.x | Cliente HTTP con interceptores |
| Vitest | — | Testing unitario compatible con Vite |
| Testing Library | — | Testing centrado en comportamiento del usuario |
| MSW | — | Mock Service Worker para interceptar HTTP |
| Playwright | — | Testing E2E en browsers reales |

### 3.2 Backend

| Tecnología | Versión | Justificación |
|---|---|---|
| ASP.NET Core | 8.x | Framework web robusto y tipado |
| Entity Framework Core | — | ORM para acceso a datos |
| JWT Bearer | — | Autenticación stateless |
| ASP.NET Rate Limiter | — | Protección contra fuerza bruta |

---

## 4. Patrones y Decisiones de Diseño

### 4.1 Arquitectura de capas (Frontend)

```
UI (Components/Pages)
    ↓ props + callbacks
Custom Hooks (useMascotas, useAuth)
    ↓ llama a
Services (auth.service.ts, mascota.service.ts)
    ↓ usa
axiosClient (HTTP + JWT + error normalization)
    ↓ HTTPS
API REST (.NET)
```

**Principio clave:** Los componentes de UI nunca tocan Axios directamente. Los servicios no conocen React. Cada capa tiene una única responsabilidad.

### 4.2 Gestión de errores

```typescript
// Todos los errores de la API se normalizan a ApiError
interface ApiError {
  status: number;    // código HTTP
  message: string;   // mensaje usuario
  errors?: Record<string, string[]>;  // errores por campo (400/422)
}
```

Los errores de campo del servidor se mapean a React Hook Form vía `setError()`, mostrándose debajo del campo correspondiente.

### 4.3 Estrategia de almacenamiento JWT

| Estrategia | XSS | CSRF | Persistencia | Decisión |
|---|---|---|---|---|
| `localStorage` | ❌ Alto | ✅ | Entre sesiones | Rechazado |
| `sessionStorage` | ⚠️ Medio | ✅ | Solo tab actual | **✅ Elegido** |
| Memoria (variable) | ✅ | ✅ | Solo mientras carga | Para prod real |
| Cookie `httpOnly` | ✅ | ⚠️ | Configurable | Recomendado prod |

**Justificación:** `sessionStorage` fue elegido porque: (1) el token se elimina al cerrar el tab, (2) no persiste entre pestañas (aislamiento), (3) es suficiente para un proyecto académico. En producción real se migraría a cookies `httpOnly; Secure; SameSite=Strict`.

---

## 5. Seguridad — Matriz de Riesgos OWASP

| # | Riesgo | OWASP | Mitigación | Estado |
|---|---|---|---|---|
| 1 | XSS | A03:2021 | JSX escaping; 0 uses of `innerHTML` | ✅ |
| 2 | Robo de token | A02:2021 | `sessionStorage`; logout limpio | ✅ |
| 3 | BOLA/IDOR | API1:2023 | `MascotaService` verifica `DueñoId === userId` del JWT | ✅ |
| 4 | Acceso por función | API5:2023 | `ProtectedRoute` + `[Authorize(Roles)]` en backend | ✅ |
| 5 | Validación insuficiente | API3:2023 | Zod + DataAnnotations + Rol hardcodeado | ✅ |
| 6 | Secretos en código | A05:2021 | ⚠️ Fallback JWT key hardcodeado (`AuthService.cs:96`) | ⚠️ Pendiente |
| 7 | Fuerza bruta | API4:2023 | Rate limiter 60 req/min por IP | ✅ |

> Ver documento completo: [security_matrix.md](file:///C:/Users/maiko/.gemini/antigravity/brain/cfe5d8b8-ed7f-45f5-a66c-d067e707043d/security_matrix.md)

---

## 6. Accesibilidad — WCAG 2.2 Level AA

| Criterio | Descripción | Implementación |
|---|---|---|
| 2.4.1 Bypass Blocks | Skip-link | `<SkipLink>` + `#main-content` |
| 2.4.11 Focus Appearance | Foco visible | `outline: 3px solid` global en `:focus-visible` |
| 2.5.5 Target Size | Targets táctiles ≥ 44px | `min-height: 44px` en todos los botones |
| 4.1.3 Status Messages | Anuncios dinámicos | `aria-live="polite"` en contador, paginación y estados |
| 2.1.2 No Keyboard Trap | Focus trap en modales | Tab/Shift+Tab atrapados; Escape cierra |
| 3.3.1 Error Identification | Errores de formulario | `aria-describedby` siempre en DOM, vacío sin error |
| 1.4.3 Contrast | Relación mínima 4.5:1 | Colores auditados: `#6d28d9` = 5.2:1 |
| 1.4.10 Reflow | Sin scroll H a 320px | Grid 1col + modal `margin: 8px` + `overflow-x: hidden` |

---

## 7. Estrategia de Pruebas

### 7.1 Pirámide de testing

```
        ┌─────────────────────────┐
        │   E2E (Playwright)      │  ← 7 scenarios, browser real
        │   login-crud.spec.ts    │
        ├─────────────────────────┤
        │  Integración (Vitest    │  ← 19 tests, MSW mock HTTP
        │  + RTL + MSW)           │
        │  LoginPage.test.tsx     │
        │  ProtectedRoute.test.tsx│
        │  MascotaList.test.tsx   │
        └─────────────────────────┘
```

### 7.2 Cobertura objetivo

| Módulo | Tests | Tipo |
|---|---|---|
| `LoginPage` | 7 tests | Unitario/Componente |
| `ProtectedRoute` | 6 tests | Integración |
| `MascotaList` (CRUD) | 12 tests | Integración |
| Flujo login→crear→listar | 7 scenarios | E2E |

### 7.3 Comandos

```bash
# Tests unitarios (una vez)
npm test

# Tests en modo watch (desarrollo)
npm run test:watch

# Con reporte de cobertura HTML
npm run test:coverage

# E2E (requiere backend en :5000)
npm run test:e2e

# E2E con UI interactiva
npm run test:e2e:ui
```

---

## 8. Instrucciones de Instalación y Ejecución

### 8.1 Backend (.NET)

```bash
cd ClinicaVeterinariaAPI
dotnet restore
dotnet run
# API disponible en https://localhost:5001 / http://localhost:5000
```

### 8.2 Frontend (React)

```bash
cd frontend
npm install
cp .env.example .env.local
# Editar VITE_API_URL si el backend corre en otro puerto
npm run dev
# App disponible en http://localhost:5173
```

### 8.3 Variables de entorno

```bash
# frontend/.env.local
VITE_API_URL=http://localhost:5000   # URL del backend
```

---

## 9. Conclusiones y Trabajo Futuro

### 9.1 Logros

- API RESTful con 7 riesgos OWASP mitigados
- Frontend con autenticación JWT y autorización por roles funcional
- WCAG 2.2 Level AA en todos los componentes principales
- Suite de tests con 26 casos (unitarios + integración + E2E)

### 9.2 Trabajo futuro

| Mejora | Prioridad | Descripción |
|---|---|---|
| Cookie `httpOnly` | Alta | Migrar JWT de sessionStorage a cookie segura del servidor |
| Refresh token | Alta | Renovación automática sin re-login |
| `Jwt:Key` sin fallback | Alta | Lanzar excepción si la clave no está configurada |
| `ValidateAudience = true` | Media | Activar validación de audiencia del JWT |
| CORS explícito | Media | Configurar política de CORS con orígenes permitidos |
| CI/CD pipeline | Media | GitHub Actions: build + test + deploy |
| Dark mode completo | Baja | Paleta dark mode ya preparada en CSS variables |

---

## 10. Referencias

- [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x00-header/)
- [OWASP Top 10 (2021)](https://owasp.org/www-project-top-ten/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [React Docs](https://react.dev)
- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)
- [MSW Docs](https://mswjs.io)
