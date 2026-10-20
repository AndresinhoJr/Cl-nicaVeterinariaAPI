# Estructura y Guion de Diapositivas — Exposición Final

> **Proyecto:** Sistema de Gestión Clínica Veterinaria (Full-Stack)  
> **Asignatura:** Desarrollo de Aplicaciones Web  
> **Duración estimada:** 10 – 15 minutos  

---

## Diapositiva 1: Portada
* **Título:** Sistema Integral de Gestión para Clínica Veterinaria
* **Subtítulo:** Arquitectura Web Segura, Accesible y Basada en Componentes
* **Integrantes:** [Tu Nombre Completo]
* **Docente:** [Nombre del Docente]
* **Fecha:** Octubre 2026

---

## Diapositiva 2: Caso de Negocio y Objetivos
* **Problema:** Necesidad de centralizar fichas clínicas, pacientes, citas médicas y tratamientos con acceso protegido para dueños y personal médico.
* **Solución Implementada:**
  * Separación de responsabilidades: API RESTful en backend y SPA reactiva en frontend.
  * Consumo 100% en tiempo real sin mocks en producción.
  * Roles diferenciados: Administrador (gestión global), Veterinario (atención clínica y fichas), Cliente (visualización de sus mascotas y citas).

---

## Diapositiva 3: Arquitectura Técnica Full-Stack
* **Frontend:**
  * React 19 + Vite 6 + TypeScript (Strict Mode).
  * Estilizado con Tailwind CSS (paleta slate/sky moderna, sin emojis) y CSS Modules desacoplados.
  * Formularios controlados con React Hook Form + validaciones de esquema con Zod.
* **Backend:**
  * ASP.NET Core 10 con Minimal APIs agrupadas (`MapGroup`).
  * Patrón Repository y Unit of Work sobre Entity Framework Core (SQL Server / SQLite).
  * Pipeline HTTP con middlewares: Global Exception (RFC 7807 ProblemDetails) y Request Logging.

---

## Diapositiva 4: Manejo de Estado y Consumo de API
* **Estado Global:**
  * `AuthContext` gestiona la sesión activa, estado de autenticación y verificación de roles (`hasRole`).
* **Estado Local & Hooks Personalizados:**
  * Custom hooks (`useMascotas`, etc.) aíslan llamadas asíncronas, paginación, filtros y mutaciones CRUD.
* **Cliente HTTP Centralizado:**
  * Instancia única de Axios con timeout y baseUrl configurable.
  * Interceptor de request: adjunta automáticamente `Authorization: Bearer <token>`.
  * Interceptor de response: normaliza errores HTTP y dispara evento `auth:unauthorized` ante expiraciones (401).

---

## Diapositiva 5: Estrategia de Almacenamiento del Token y Autenticación
* **Por qué `sessionStorage`:**
  * Se analizó `localStorage` vs `sessionStorage` vs Cookies `HttpOnly`.
  * `sessionStorage` destruye el token automáticamente al cerrar la pestaña o navegador.
  * No persiste credenciales en discos ni es compartido entre pestañas de diferentes sesiones.
* **Manejo de Expiración:**
  * Doble seguro: validación de timestamp al enfocar ventana y captura del 401 del backend para purga inmediata de memoria.

---

## Diapositiva 6: Matriz de Riesgos de Seguridad Mitigados (OWASP)
* **OWASP A01 (Broken Object Level Authorization - BOLA):**
  * Validación en backend: Los clientes solo pueden consultar y recibir datos de sus propias mascotas, independientemente de los IDs solicitados.
* **OWASP A02 (Cryptographic Failures):**
  * Contraseñas hasheadas con `PasswordHasher<T>` (PBKDF2 con sal por usuario). Verificación estricta en cambio de contraseña.
* **OWASP A03 (Injection / XSS):**
  * Dapper / EF Core con consultas parametrizadas (inmune a SQLi).
  * JSX escaping automático sin uso de `dangerouslySetInnerHTML` ni `innerHTML` (0 ocurrencias).
* **OWASP A04 & A05 (Security Misconfiguration & Rate Limiting):**
  * Limitador de tasa: 60 peticiones/minuto por IP con respuesta HTTP 429.
  * Política CORS explícita (`FrontendPolicy`) restringiendo orígenes al puerto del cliente.
  * Auditoría de dependencias: **0 vulnerabilidades** en `npm audit` y `dotnet list package --vulnerable`.

---

## Diapositiva 7: Accesibilidad (WCAG 2.2 AA) y Diseño Responsivo
* **Criterios Cumplidos:**
  * **2.4.1 Bypass Blocks:** Enlace "Saltar al contenido principal" (`SkipLink`) para usuarios de teclado.
  * **1.4.3 Contraste:** Ratios superiores a 4.5:1 en textos principales y badges.
  * **4.1.2 Name, Role, Value:** Modales con `role="dialog"`, trampas de foco y atributos `aria-describedby` para validaciones.
  * **1.4.10 Reflow:** Diseño adaptable desde móviles de 320–375px hasta pantallas de escritorio sin scroll horizontal.

---

## Diapositiva 8: Suite de Pruebas Automatizadas
* **Backend (xUnit):**
  * 8 pruebas de integración con `WebApplicationFactory` probando endpoints, validaciones DTO y roles (100% aprobadas).
* **Frontend Componentes (Vitest + Testing Library):**
  * 25 pruebas unitarias simulando eventos de usuario y mocks de red con MSW (100% aprobadas).
* **End-to-End (Playwright):**
  * 14 escenarios E2E reales (Chromium Desktop + Mobile Chrome) cubriendo flujo completo: Login, CRUD de mascota, validaciones Zod, logout y viewport móvil (100% aprobadas).

---

## Diapositiva 9: Bitácora de Uso de Inteligencia Artificial
* **Herramientas:** Antigravity (Google DeepMind) con Gemini 2.5 Pro y Claude 3.5 Sonnet.
* **Metodología y Supervisión:**
  * Todo código generado fue auditado, adaptado y corregido manualmente.
  * Registro de decisiones documentado en `AI_LOG.md`:
    * *Aceptado:* Estructura de hooks y módulos.
    * *Corregido:* Desfase de validaciones de roles y adaptación de selects asíncronos.
    * *Descartado:* Sugerencias de librerías innecesarias (SWR, librerías pesadas de iconos).

---

## Diapositiva 10: Demostración en Vivo y Preguntas
* **Demostración Práctica:**
  1. Inicio de sesión como Veterinario / Administrador.
  2. Registro de nueva mascota y selección de cliente.
  3. Comprobación de seguridad (intento de acceso no autorizado 401/403).
  4. Revisión del reporte de pruebas automatizadas.
* **Espacio para preguntas del docente.**
