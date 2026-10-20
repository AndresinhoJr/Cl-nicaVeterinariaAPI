# Bitácora de Uso de IA — Clínica Veterinaria

> Documento que registra el proceso de desarrollo asistido por herramientas
> de inteligencia artificial. Incluye prompts utilizados, respuestas obtenidas
> y decisiones tomadas sobre cada sugerencia.

---

## Resumen Ejecutivo

| Campo | Detalle |
|---|---|
| **Herramienta principal** | Antigravity (Google DeepMind) |
| **Modelo** | Gemini 2.5 Pro (inherit) |
| **Conversación** | `cfe5d8b8-ed7f-45f5-a66c-d067e707043d` |
| **Período** | Octubre 2026 |
| **Sesiones totales** | 6 sesiones principales |
| **Archivos generados** | ~35 archivos (TSX, CSS, CS, MD) |
| **Tests generados** | 26 tests unitarios + 7 scenarios E2E |

---

## Herramientas Utilizadas

| Herramienta | Tipo | Uso en el proyecto |
|---|---|---|
| **Antigravity (Gemini 2.5 Pro)** | Asistente de código agéntico | Arquitectura, implementación completa, auditorías |
| **GitHub Copilot** | Autocompletado | Completar líneas repetitivas y boilerplate |
| **WCAG Quick Reference** | Referencia técnica | Verificar criterios de accesibilidad |

---

## Entradas de la Bitácora

---

### Sesión 1 — Arquitectura de Servicios y Capa HTTP

**Fecha:** Octubre 2026  
**Herramienta:** Antigravity | **Modelo:** Gemini 2.5 Pro

#### Prompt utilizado

```
Actúa como un experto en arquitecturas frontend con React, TypeScript y Vite.
Ya tengo mi API desarrollada (ClinicaVeterinariaAPI) y la estructura base de mi
frontend. Necesito que revises y refactorices la capa de consumo de servicios
para cumplir con lo siguiente:
1. Estructura modular (por features o capas) clara y mantenible.
2. Cliente HTTP centralizado (usando Axios) con la URL base desde VITE_API_URL.
3. Interceptor que adjunte automáticamente el token JWT en "Authorization: Bearer".
4. Servicios separados de los componentes de interfaz y tipados (DTOs/Interfaces).
```

#### Respuesta obtenida (resumen)

La IA propuso una estructura de 5 capas: `api/`, `services/`, `types/`, `context/`, `features/`. Generó `axiosClient.ts` con interceptores de request (JWT) y response (normalización de errores).

#### ✅ Aceptado sin cambios

- Estructura de carpetas propuesta (`api/`, `types/`, `services/`, `context/`, `features/`)
- `axiosClient.ts` con `interceptors.request` para adjuntar JWT
- `ApiError` interface para normalización de errores

#### 🔧 Corregido / Ajustado

| Elemento | Cambio realizado | Razón |
|---|---|---|
| URL base fallback | Cambiado de `''` a `'http://localhost:5000'` | Para que funcione en desarrollo sin `.env.local` |
| `normalizeError()` | Añadida extracción de `errors` por campo (para 400/422) | La API devuelve errores por campo que el form necesita |

#### ❌ Descartado

- Sugerencia de usar SWR como cliente HTTP alternativo → el proyecto ya tiene Axios instalado y la curva de aprendizaje no se justifica en el plazo.

---

### Sesión 2 — CRUD Completo de Mascotas

**Fecha:** Octubre 2026  
**Herramienta:** Antigravity | **Modelo:** Gemini 2.5 Pro

#### Prompt utilizado

```
Actúa como desarrollador frontend senior en React. Necesito implementar el CRUD
completo para Mascotas:
- Listado con paginación y filtros por especie, skeletons/spinners, estados vacío/error
- Creación y edición con React Hook Form + Zod
- Eliminación con confirmación modal
- Manejo de errores HTTP 400/422 mapeados a campos del formulario
```

#### Respuesta obtenida (resumen)

Generó: `MascotaList.tsx` (con estados loading/error/empty y grid de tarjetas), `MascotaForm.tsx` (RHF + Zod + mapeo de errores del servidor), `DeleteModal.tsx`, `useMascotas.ts` (custom hook con estado asíncrono), `mascota.schema.ts`, `mascota.types.ts`, y los correspondientes CSS Modules.

#### ✅ Aceptado sin cambios

- Arquitectura del hook `useMascotas` con estado separado para `list` y `mutation`
- Patrón de mapeo de errores del servidor con `setError()` de RHF
- CSS Modules con variables CSS del design system

#### 🔧 Corregido / Ajustado

| Elemento | Cambio realizado | Razón |
|---|---|---|
| IDs de campos del form | `nombre` → `mascota-nombre` | Evitar colisión con IDs globales del DOM |
| `aria-describedby` | Cambiado de condicional a siempre-en-DOM | Corrección WCAG posterior (sesión 5) |
| Enum `ESPECIES_VALIDAS` | Movido a `mascota.types.ts` | Reutilizado en form y en lista de filtros |

#### ❌ Descartado

- Propuesta de usar `React.memo` en `MascotaCard` → no hay evidencia de problema de performance con la cantidad de datos actual; prematura optimización.
- Integración de react-query → sin gestor de estado externo según el alcance acordado.

---

### Sesión 3 — Sistema de Autenticación y Rutas Protegidas

**Fecha:** Octubre 2026  
**Herramienta:** Antigravity | **Modelo:** Gemini 2.5 Pro

#### Prompt utilizado

```
Necesito implementar el sistema de autenticación y autorización:
1. Formulario de login conectado al endpoint con manejo de errores
2. Estrategia justificada de almacenamiento del token JWT
3. Logout que limpie por completo el estado global y local
4. Interceptor que detecte tokens expirados (401) y redirija al login
5. Rutas protegidas con dos roles de usuario y vista de acceso denegado (403)
```

#### Respuesta obtenida (resumen)

Generó `AuthContext.tsx` con `useNavigate`, listener de evento `auth:unauthorized`, y verificación de expiración en `window focus`. Generó `ProtectedRoute.tsx` con doble nivel de guardia (autenticación + rol). Justificó `sessionStorage` sobre `localStorage`.

#### ✅ Aceptado sin cambios

- Patrón de evento custom `window.dispatchEvent(new CustomEvent('auth:unauthorized'))` para logout desde el interceptor sin importar React en Axios
- `useRef` para evitar closure stale en el listener de AuthContext
- `ProtectedRoute` con `allowedRoles` como prop opcional

#### 🔧 Corregido / Ajustado

| Elemento | Cambio realizado | Razón |
|---|---|---|
| `navigate` en interceptor | Reemplazado por evento custom | `useNavigate` no puede usarse fuera de componentes React |
| Verificación de expiración | Añadida en `window focus` | La IA inicialmente solo verificaba en mount |

#### ❌ Descartado

- Propuesta de usar Zustand para estado de sesión → el `AuthContext` con hooks es suficiente para el proyecto académico sin agregar dependencias.

---

### Sesión 4 — Auditoría de Seguridad OWASP

**Fecha:** Octubre 2026  
**Herramienta:** Antigravity | **Modelo:** Gemini 2.5 Pro

#### Prompt utilizado

```
Actúa como especialista en ciberseguridad web. Necesito preparar documentación
y verificar la mitigación de al menos 5 riesgos del OWASP API Security Top 10
y OWASP Top 10 web (al menos 3 del lado cliente: XSS, robo de tokens,
control de acceso roto, validación insuficiente, exposición de secretos).
Formato: Riesgo, Referencia OWASP, Ubicación exacta, Mitigación, Evidencia.
```

#### Respuesta obtenida (resumen)

La IA ejecutó un subagente de auditoría que leyó 16 archivos del proyecto con líneas exactas. Generó una matriz de 7 riesgos con evidencia de código real. Identificó la brecha crítica en `AuthService.cs:96` (fallback de clave JWT hardcodeado).

#### ✅ Aceptado sin cambios

- Toda la matriz de riesgos (7 entradas con evidencia de líneas de código reales)
- Identificación de `ValidateAudience = false` como vulnerabilidad adicional
- Identificación de ausencia de CORS como riesgo en desarrollo

#### 🔧 Corregido / Ajustado

| Elemento | Cambio realizado | Razón |
|---|---|---|
| Riesgo 6 marcado como ⚠️ Parcial | Se añadió código de corrección recomendado | La IA lo identificó pero no lo corrigió automáticamente; se añadió la solución |

#### ❌ Descartado

- Sugerencia de implementar CSP headers en Vite → Vite no tiene soporte nativo de CSP; requeriría configuración del servidor web (nginx/Apache) fuera del alcance del proyecto.

---

### Sesión 5 — Auditoría WCAG 2.2 y Responsivo Mobile-First

**Fecha:** Octubre 2026  
**Herramienta:** Antigravity | **Modelo:** Gemini 2.5 Pro

#### Prompt utilizado

```
Revisa los componentes principales para asegurar WCAG 2.2 nivel AA y
diseño responsivo mobile-first:
1. HTML semántico (landmarks, encabezados h1-h6, botones y enlaces)
2. Formularios accesibles: label, aria-describedby para errores, aria-live
3. Navegación por teclado con foco visible y gestión de foco en modales
4. Contraste mínimo 4.5:1 y controles táctiles de al menos 44x44px
5. Diseño fluido sin scroll horizontal desde 320px
```

#### Respuesta obtenida (resumen)

La IA auditó 10 archivos simultáneamente, identificó 12 issues críticos y aplicó todas las correcciones: creó `SkipLink.tsx`, reescribió `DeleteModal` con focus-trap completo, actualizó `MascotaForm` con `aria-describedby` siempre en el DOM, actualizó CSS para `min-height: 44px` en todos los controles, y añadió `prefers-reduced-motion` global.

#### ✅ Aceptado sin cambios

- Todos los cambios de CSS (touch targets 44px, colores, focus-visible global)
- Focus-trap en DeleteModal con Tab/Shift+Tab
- `<search>` como landmark para filtros
- `aria-live` en contador de resultados y paginación

#### 🔧 Corregido / Ajustado

| Elemento | Cambio realizado | Razón |
|---|---|---|
| `role="alertdialog"` en DeleteModal | Mantenido (propuesta correcta) | Es la semántica correcta para confirmaciones destructivas; verificado en spec W3C |
| `aria-live` en `<section>` | Cambiado a solo en el `<p>` del contador | Poner aria-live en el contenedor entero causaría re-anuncios excesivos |

#### ❌ Descartado

- Propuesta de añadir `aria-current="page"` en los paginadores de número → No se implementan paginadores de página individuales (solo prev/next); no aplica.

---

### Sesión 6 — Testing Automatizado (Vitest + Playwright)

**Fecha:** Octubre 2026  
**Herramienta:** Antigravity | **Modelo:** Gemini 2.5 Pro

#### Prompt utilizado

```
Necesito la estrategia de pruebas automatizadas:
1. Tests de componentes con Vitest + Testing Library + MSW para:
   login, ruta protegida, una operación CRUD
2. Test E2E con Playwright que valide: login → crear registro → listar
3. Estructura del Informe Técnico y Bitácora de Uso de IA
```

#### Respuesta obtenida (resumen)

La IA instaló las dependencias, configuró `vite.config.ts` con el bloque `test`, creó el servidor MSW con handlers que replican el contrato exacto de la API, generó 25 tests en 3 suites, configuró Playwright e instaló Chromium, generó el test E2E de 7 scenarios incluyendo verificación de scroll horizontal (WCAG 1.4.10).

#### ✅ Aceptado sin cambios

- Configuración de MSW con handlers de error exportados para uso en tests individuales
- Patrón `server.use(errorHandler)` para sobreescribir handlers en tests individuales
- `renderWithProviders()` con `seedSession()` para pre-cargar sesión sin llamar a la API
- Test E2E con `page.evaluate()` para verificar scroll horizontal
- Comentario de "Modo sin backend" con `page.route()` en el spec de Playwright

#### 🔧 Corregido / Ajustado

| Elemento | Cambio realizado | Razón |
|---|---|---|
| `onUnhandledRequest: 'error'` | Mantenido explícito | Garantiza que ninguna petición real se escape durante tests |
| Test de skeletons | Cambiado de `getByTestId` a `querySelectorAll('[aria-hidden="true"]')` | No usar `data-testid` cuando hay atributos semánticos disponibles |

#### ❌ Descartado

- Propuesta de añadir Cypress como alternativa a Playwright → Playwright tiene mejor soporte para TypeScript nativo y API más moderna; se mantiene solo Playwright.
- Tests de snapshot → Los snapshots son frágiles ante cambios de CSS; preferir assertions semánticas.

---

## Reflexión General

### ¿Qué aportó la IA?

1. **Velocidad de scaffolding:** Generó la estructura completa de carpetas y archivos base en minutos, permitiendo enfocarse en la lógica de negocio específica.

2. **Conocimiento de patrones:** Aplicó automáticamente patrones como el evento custom `auth:unauthorized`, el focus-trap en modales y el `aria-describedby` siempre-en-DOM, que habrían requerido investigación extensa.

3. **Auditoría exhaustiva:** Revisó 16 archivos simultáneamente para la auditoría de seguridad, identificando vulnerabilidades que son fáciles de pasar por alto.

### ¿Qué requirió supervisión humana?

1. **Ajustes de IDs de campos:** La IA usó IDs genéricos (`nombre`, `especie`) que colisionarían en aplicaciones más grandes; se corrigieron a IDs únicos (`mascota-nombre`).

2. **Decisiones de stack:** La IA propuso Zustand, react-query y SWR en diferentes momentos. Se rechazaron correctamente para mantener el proyecto dentro de su alcance académico.

3. **Verificación de contraste:** Los valores numéricos de contraste de la IA (ej. `#9390a8` = 2.7:1) fueron verificados manualmente con la herramienta WebAIM Contrast Checker antes de aceptar los colores corregidos.

4. **Brechas de seguridad:** El fallback hardcodeado de la clave JWT fue identificado por la IA, pero la decisión de documentarlo como ⚠️ Parcial (no corregirlo en producción) fue una decisión humana consciente basada en el alcance del proyecto.

### Estimación de tiempo ahorrado

| Tarea | Estimado manual | Con IA | Ahorro |
|---|---|---|---|
| Arquitectura base | 4h | 30min | 87% |
| CRUD completo | 8h | 1h | 87% |
| Sistema de auth | 6h | 45min | 87% |
| Auditoría OWASP | 4h | 30min | 87% |
| Correcciones WCAG | 6h | 1h | 83% |
| Setup de testing | 4h | 30min | 87% |
| **Total** | **~32h** | **~4.25h** | **~87%** |
