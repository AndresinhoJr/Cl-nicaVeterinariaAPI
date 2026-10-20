# Matriz de Riesgos de Seguridad — ClinicaVeterinariaAPI

> Auditoría sobre código real. Referencias exactas a archivos y líneas verificadas.
> Fecha: octubre 2026 | Stack: ASP.NET Core 8 (API) + React 19 + Vite (Frontend)

---

## Metodología

Se analizaron los siguientes riesgos aplicando **OWASP API Security Top 10 (2023)**
y **OWASP Top 10 Web (2021)**. Cada riesgo fue trazado hasta su ubicación exacta
en el código fuente con evidencia de verificación reproducible.

---

## RIESGO 1 — Cross-Site Scripting (XSS) Reflejado / DOM

| Campo | Detalle |
|---|---|
| **Riesgo identificado** | Inyección de scripts maliciosos via datos renderizados sin sanitizar |
| **Referencia OWASP** | **A03:2021 – Injection** (OWASP Top 10 Web) |
| **CVSS estimado** | 7.5 HIGH |
| **Origen** | Cliente — capa de presentación React |

### Ubicación exacta

```
frontend/src/features/mascotas/MascotaList.tsx
  → MascotaCard: renderiza mascota.nombre, mascota.especie, mascota.emailDueno

frontend/src/pages/LoginPage.tsx
  → Renderiza session.nombreUsuario en Navbar.tsx
```

### Mitigación aplicada

**1. JSX escaping automático de React** — React escapa todo texto interpolado
en `{}` por defecto. Los valores del servidor nunca se insertan como HTML crudo.

```tsx
// MascotaList.tsx — React escapa {mascota.nombre} automáticamente
<h3 className={styles.cardName}>{mascota.nombre}</h3>
<span className={styles.cardSpecies}>{mascota.especie}</span>
<dd className={styles.emailCell}>{mascota.emailDueno}</dd>
```

**2. Ausencia total de vectores XSS explícitos** — búsqueda exhaustiva:

```bash
# Resultado: 0 ocurrencias
grep -r "dangerouslySetInnerHTML" frontend/src/  → No results found
grep -r "innerHTML"               frontend/src/  → No results found
grep -r "document.write"          frontend/src/  → No results found
grep -r "eval("                   frontend/src/  → No results found
```

**3. Sin tokens en URLs** — el JWT viaja únicamente en el header
`Authorization: Bearer`, nunca en query params ni en el DOM.

```typescript
// axiosClient.ts — línea 31
config.headers['Authorization'] = `Bearer ${token}`;
```

### Evidencia de verificación

```
✅ grep -r "dangerouslySetInnerHTML" src/  → 0 resultados
✅ grep -r "innerHTML"               src/  → 0 resultados
✅ Revisión manual: 0 usos de v-html, eval(), document.write()
✅ Token NUNCA en URL, localStorage, o atributo DOM
```

### Brecha pendiente (producción)

> [!WARNING]
> Configurar `Content-Security-Policy` en el servidor web:
> ```
> Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' fonts.googleapis.com
> ```
> Esto bloquea scripts inyectados aunque JSX sea bypassado.

---

## RIESGO 2 — Robo de Token / Almacenamiento Inseguro de Credenciales

| Campo | Detalle |
|---|---|
| **Riesgo identificado** | Token JWT accesible a scripts de terceros via `localStorage` persistente |
| **Referencia OWASP** | **A02:2021 – Cryptographic Failures** + **API8:2023 – Security Misconfiguration** |
| **CVSS estimado** | 8.1 HIGH |
| **Origen** | Cliente — gestión de estado de sesión |

### Análisis comparativo de estrategias

| Almacenamiento | Riesgo XSS | Riesgo CSRF | Persistencia | Decisión |
|---|---|---|---|---|
| `localStorage` | ❌ Alto (survives tab close) | ✅ Inmune | Entre sesiones y tabs | **Rechazado** |
| `sessionStorage` | ⚠️ Mismo riesgo XSS activo | ✅ Inmune | Solo tab actual | **✅ Elegido** |
| Variable en memoria | ✅ Mejor (no en DOM API) | ✅ Inmune | Hasta F5 | Para prod con refresh |
| Cookie `httpOnly; Secure` | ✅ JS no puede leerla | ⚠️ CSRF mitigable con SameSite | Configurable | Ideal producción real |

### Ubicación exacta

```
frontend/src/api/axiosClient.ts — líneas 6-15
```

### Mitigación aplicada

```typescript
// axiosClient.ts — líneas 6-15
// JUSTIFICACIÓN: sessionStorage vs localStorage
// - Se elimina al cerrar el tab (no hay sesiones huérfanas)
// - No persiste entre pestañas (aislamiento de sesión)
// - Token no accesible desde iframes cross-origin
export const TOKEN_KEY = 'clinica_auth_token';

export const getStoredToken = (): string | null =>
  sessionStorage.getItem(TOKEN_KEY);        // ← sessionStorage, no localStorage

export const setStoredToken = (token: string): void =>
  sessionStorage.setItem(TOKEN_KEY, token);

export const removeStoredToken = (): void =>
  sessionStorage.removeItem(TOKEN_KEY);
```

```typescript
// AuthContext.tsx — logout() limpia TODO en orden
const logout = useCallback(() => {
  svcLogout();        // 1. sessionStorage: token + session
  clearSession();     // 2. doble seguro
  setSession(null);   // 3. estado React
  navigate('/login'); // 4. router SPA
}, [navigate]);
```

### Evidencia de verificación

```bash
# Búsqueda de localStorage en el código
grep -r "localStorage" frontend/src/

# Resultado:
# LoginPage.tsx:179: "Sin cookies ni localStorage."  ← solo en comentario UI
# → CERO usos funcionales de localStorage

# Verificación en DevTools (Runtime):
# sessionStorage.getItem('clinica_auth_token') → token presente durante sesión
# [cerrar tab] → sessionStorage.getItem('clinica_auth_token') → null ✅
```

### Brecha pendiente (producción)

> [!CAUTION]
> Para producción real: migrar a **cookie `httpOnly; Secure; SameSite=Strict`**
> emitida desde el servidor. Esto hace el token completamente inaccesible a JavaScript,
> eliminando el riesgo XSS de raíz. Requiere implementar refresh token en el backend.

---

## RIESGO 3 — Control de Acceso Roto a Nivel de Objeto (BOLA / IDOR)

| Campo | Detalle |
|---|---|
| **Riesgo identificado** | Usuario Cliente accede a objetos de otros usuarios manipulando el ID en la URL |
| **Referencia OWASP** | **API1:2023 – Broken Object Level Authorization (BOLA)** |
| **CVSS estimado** | 9.1 CRITICAL |
| **Origen** | Backend — capa de servicios |

### Ubicación exacta

```
ClinicaVeterinariaAPI/Services/MascotaService.cs — líneas 46-58 (GetById)
ClinicaVeterinariaAPI/Services/MascotaService.cs — líneas 81-98 (Update)
ClinicaVeterinariaAPI/Services/MascotaService.cs — líneas 100-118 (Delete)
ClinicaVeterinariaAPI/Services/MascotaService.cs — líneas 24-27 (GetPaged, filtro automático)
```

### Mitigación aplicada

**Nivel de servicio — verificación de propiedad en CADA operación:**

```csharp
// MascotaService.cs — líneas 46-59
// GET /api/v1/mascotas/{id}
public async Task<MascotaResponseDto?> GetByIdAsync(int id, int currentUserId, string currentUserRole)
{
    var mascota = await _unitOfWork.Mascotas.GetByIdWithDueñoAsync(id);
    if (mascota == null) return null;

    // ── BOLA CHECK: Cliente solo ve sus propias mascotas ──────────────────
    if (!currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
        !currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase) &&
        mascota.DueñoId != currentUserId)           // ← ID del token, no del body
    {
        throw new UnauthorizedAccessException("Acceso denegado: No tiene permisos para consultar esta mascota.");
    }
    return MapearADto(mascota);
}

// MascotaService.cs — líneas 86-89 (Update)
if (!currentUserRole.Equals("Admin") && mascota.DueñoId != currentUserId)
    throw new UnauthorizedAccessException("...");

// MascotaService.cs — líneas 105-108 (Delete)
if (!currentUserRole.Equals("Admin") && mascota.DueñoId != currentUserId)
    throw new UnauthorizedAccessException("...");
```

**Filtrado automático en listado (líneas 24-27):**
```csharp
// El ID del dueño viene del JWT (currentUserId), nunca del query param del cliente
int? dueñoIdConsulta = (Admin || Vet) ? filtroDueñoId : currentUserId;
```

**Origen del userId — siempre del JWT, nunca del cliente:**
```csharp
// MascotaApi.cs — línea 113-114
var idClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
int userId = int.TryParse(idClaim, out int parsedId) ? parsedId : 0;
```

### Evidencia de verificación

```
✅ GET /api/v1/mascotas/99 con token de usuario ID=1 → 403 Forbidden
✅ GET /api/v1/mascotas/1  con token de usuario ID=1 → 200 OK
✅ PUT /api/v1/mascotas/2  con token de usuario ID=1 (otro dueño) → 403 Forbidden
✅ El userId se extrae de ClaimTypes.NameIdentifier del JWT, no de query params
```

---

## RIESGO 4 — Control de Acceso Roto a Nivel de Función (Broken Function Authorization)

| Campo | Detalle |
|---|---|
| **Riesgo identificado** | Usuario sin privilegios accede a endpoints o rutas reservadas para Admin/Veterinario |
| **Referencia OWASP** | **API5:2023 – Broken Function Level Authorization** + **A01:2021 – Broken Access Control** |
| **CVSS estimado** | 8.8 HIGH |
| **Origen** | Frontend (rutas) + Backend (endpoints) |

### Ubicación exacta

```
Frontend:
  src/components/ProtectedRoute.tsx — líneas 32-52
  src/App.tsx — líneas 74-88

Backend:
  ClinicaVeterinariaAPI/Endpoints/TratamientoApi.cs — líneas 39, 60
```

### Mitigación aplicada — Doble capa de defensa

**Capa 1 — Frontend: ProtectedRoute con doble nivel de guardia**

```tsx
// ProtectedRoute.tsx — líneas 32-52
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  // Nivel 1: ¿Está autenticado?
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nivel 2: ¿Tiene el rol requerido?
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;  // → página 403
  }

  return <Outlet />;  // acceso concedido
}

// App.tsx — líneas 74-88
// Rutas con restricción de rol:
<Route element={<ProtectedRoute allowedRoles={['Admin', 'Veterinario']} />}>
  <Route path="/tratamientos" element={...} />
</Route>
<Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
  <Route path="/admin" element={<AdminPage />} />
</Route>
```

**Capa 2 — Backend: `[Authorize(Roles)]` en endpoints críticos**

```csharp
// TratamientoApi.cs — línea 39
.RequireAuthorization(new AuthorizeAttribute { Roles = "Admin,Veterinario" })

// TratamientoApi.cs — línea 60
.RequireAuthorization(new AuthorizeAttribute { Roles = "Admin,Veterinario" })
```

**Por qué doble capa:** el frontend protege la UX (evita rutas visibles),
pero el backend protege los datos reales. Un atacante con Postman puede
saltarse el frontend; el backend es la línea de defensa final.

### Evidencia de verificación

```
Frontend:
  ✅ Cliente navega a /admin → redirigido a /unauthorized (sin cargar AdminPage)
  ✅ Cliente navega a /tratamientos → redirigido a /unauthorized
  ✅ Veterinario navega a /admin → redirigido a /unauthorized
  ✅ Admin navega a /admin → acceso concedido

Backend (Postman):
  ✅ POST /api/v1/tratamientos con token rol=Cliente → 403 Forbidden
  ✅ DELETE /api/v1/tratamientos/1 con token rol=Cliente → 403 Forbidden
  ✅ POST /api/v1/tratamientos con token rol=Veterinario → 201 Created
```

---

## RIESGO 5 — Validación Insuficiente de Entrada / Mass Assignment

| Campo | Detalle |
|---|---|
| **Riesgo identificado** | Datos maliciosos o malformados llegan al servidor sin validación; usuario modifica campos no permitidos (ej. asignarse rol Admin en registro) |
| **Referencia OWASP** | **API3:2023 – Broken Object Property Level Auth** + **A03:2021 – Injection** |
| **CVSS estimado** | 7.5 HIGH |
| **Origen** | Frontend (formularios) + Backend (DTOs) |

### Ubicación exacta

```
Frontend:
  src/features/mascotas/mascota.schema.ts — esquema completo
  src/schemas/login.schema.ts — esquema completo
  src/features/mascotas/MascotaForm.tsx — línea 87 (noValidate)
  src/pages/LoginPage.tsx — línea 101 (noValidate)

Backend:
  ClinicaVeterinariaAPI/DTOs/Mascotas/MascotaCreateDto.cs — líneas 7-28
  ClinicaVeterinariaAPI/Services/AuthService.cs — línea 83 (Rol hardcodeado a 'Cliente')
```

### Mitigación aplicada

**Frontend — Zod schemas (validación antes de enviar):**

```typescript
// mascota.schema.ts — esquema completo
export const mascotaSchema = z.object({
  nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder 100 caracteres.')
    .trim(),
  especie: z.enum(ESPECIES_VALIDAS, {   // enum cerrado: solo 7 valores válidos
    errorMap: () => ({ message: `Especie inválida...` }),
  }),
  duenoId: z.number().int().positive().optional().nullable(),
});
```

```typescript
// LoginPage.tsx — línea 101
// noValidate: desactiva validación nativa del browser, usa Zod
<form noValidate onSubmit={handleSubmit(onSubmit)}>
```

**Backend — DataAnnotations + IValidatableObject + DTOs tipados:**

```csharp
// MascotaCreateDto.cs — validación en servidor
[Required] [StringLength(100, MinimumLength = 2)]
public string Nombre { get; set; }

[Required] [StringLength(50)]
public string Especie { get; set; }

// Validación semántica de especie (IValidatableObject)
if (!EspeciesValidas.Contains(Especie, StringComparer.OrdinalIgnoreCase))
    yield return new ValidationResult("Especie inválida...");
```

**Prevención de Mass Assignment — Rol NO es asignable por el cliente:**

```csharp
// AuthService.cs — línea 83
// El rol SIEMPRE se asigna en el servidor, nunca viene del body del request
var nuevoUsuario = new Usuario {
    Nombre = request.Nombre.Trim(),
    Email = request.Email.ToLower().Trim(),
    Rol = "Cliente"    // ← hardcoded, no existe RegisterRequestDto.Rol
};
```

### Evidencia de verificación

```
Frontend:
  ✅ Submit con nombre "" → error Zod antes de llegar al servidor
  ✅ Especie "Dinosaurio" → error Zod (enum cerrado)
  ✅ noValidate: browser no muestra tooltips propios, Zod controla todo

Backend:
  ✅ POST /api/v1/usuarios/registro con body {"rol":"Admin"} → ignorado, rol = "Cliente"
  ✅ POST /api/v1/mascotas con especie="XSS<script>" → 400 Bad Request (validación servidor)
  ✅ POST /api/v1/mascotas con nombre="a" (< 2 chars) → 400 Bad Request
```

---

## RIESGO 6 — Exposición de Información Sensible en el Bundle / Variables de Entorno

| Campo | Detalle |
|---|---|
| **Riesgo identificado** | Secretos (claves JWT, strings de conexión) hardcodeados en código fuente o expuestos en el bundle JS del cliente |
| **Referencia OWASP** | **A05:2021 – Security Misconfiguration** + **API8:2023 – Security Misconfiguration** |
| **CVSS estimado** | 9.8 CRITICAL (si afecta clave JWT de firma) |
| **Origen** | Frontend (bundle Vite) + Backend (configuración) |

### Ubicación exacta

```
frontend/.env.example — única variable VITE_API_URL (no es secreto)
frontend/.env.local    — VITE_API_URL=http://localhost:5000 (no es secreto)
frontend/src/api/axiosClient.ts — línea 19 (solo VITE_API_URL)

⚠️ Backend identificado como riesgo:
ClinicaVeterinariaAPI/Services/AuthService.cs — línea 96
```

### Evidencia del riesgo en el backend

```csharp
// AuthService.cs — línea 96 — RIESGO IDENTIFICADO ⚠️
var jwtKey = _configuration["Jwt:Key"] ?? "Mi_super-clave_ultra-secreta1234_:)";
//                                         ↑ fallback hardcodeado en código fuente
//                                           visible en git history si se commitea
```

### Mitigación aplicada

**Frontend — solo `VITE_API_URL` en el bundle (no es un secreto):**

```bash
# .env.example y .env.local:
VITE_API_URL=http://localhost:5000  ← URL pública del servidor, no un secreto

# Verificación: ninguna clave privada en frontend
grep -r "VITE_" frontend/src/
# → axiosClient.ts:19: import.meta.env.VITE_API_URL   ← solo la URL base
```

**Diseño correcto:** las variables `VITE_*` son embebidas en el bundle JS
(visibles al usuario) — por diseño de Vite. Solo se usan para configuración
pública (baseURL). NUNCA secretos JWT, DB passwords, API keys privadas.

```typescript
// axiosClient.ts — línea 19
baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
// ✅ Solo URL pública, no contiene credenciales
```

### Evidencia de verificación

```bash
# Buscar secretos en el bundle (tras build)
grep -r "secret\|password\|apiKey\|JWT_KEY" frontend/dist/  → 0 resultados

# Buscar secretos en código fuente del frontend
grep -ri "jwt.key\|db_password\|secret_key" frontend/src/   → 0 resultados
```

### Brecha pendiente — Backend (CRÍTICA)

> [!CAUTION]
> **AuthService.cs línea 96**: El fallback `"Mi_super-clave_ultra-secreta1234_:)"`
> está hardcodeado en código fuente. Si la variable de entorno `Jwt:Key` no está
> configurada en producción, se usa esta clave comprometida.
>
> **Corrección requerida:**
> ```csharp
> // ANTES (inseguro):
> var jwtKey = _configuration["Jwt:Key"] ?? "Mi_super-clave_ultra-secreta1234_:)";
>
> // DESPUÉS (seguro):
> var jwtKey = _configuration["Jwt:Key"]
>   ?? throw new InvalidOperationException("Jwt:Key no está configurada.");
> ```
>
> La clave debe estar en Azure Key Vault, AWS Secrets Manager o variable de entorno
> del sistema operativo — nunca en `appsettings.json` commiteado al repositorio.

---

## RIESGO 7 — Fuerza Bruta / Rate Limiting Insuficiente en Login

| Campo | Detalle |
|---|---|
| **Riesgo identificado** | Atacante realiza miles de intentos de login por segundo sin bloqueo |
| **Referencia OWASP** | **API4:2023 – Unrestricted Resource Consumption** + **API7:2023 – Server Side Request Forgery** |
| **CVSS estimado** | 7.3 HIGH |
| **Origen** | Backend — infraestructura |

### Ubicación exacta

```
ClinicaVeterinariaAPI/Program.cs — líneas 51-66 (Rate Limiter global)
```

### Mitigación aplicada

```csharp
// Program.cs — líneas 51-66
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "anonimo";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ip,           // ← particionado por IP
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 60,       // 60 requests por minuto por IP
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0          // sin cola → rechaza inmediatamente
            });
    });
});
```

### Evidencia de verificación

```
✅ 61 requests en 60 segundos desde la misma IP → HTTP 429 Too Many Requests
✅ QueueLimit = 0: sin acumulación de cola (fail-fast)
✅ Partición por IP: cada cliente tiene su propio bucket
```

### Brecha pendiente

> [!WARNING]
> El rate limit global (60 req/min) aplica a TODOS los endpoints.
> Para mayor seguridad en producción, aplicar un límite más estricto
> específicamente al endpoint de login (ej. 5 intentos/15 min por IP):
>
> ```csharp
> group.MapPost("/login", ...).RequireRateLimiting("login-policy");
> ```

---

## Resumen Ejecutivo

| # | Riesgo | OWASP | Severidad | Estado |
|---|---|---|---|---|
| 1 | XSS / Inyección DOM | A03:2021 | HIGH | ✅ Mitigado (JSX escaping, sin innerHTML) |
| 2 | Robo de token JWT | A02:2021 / API8 | HIGH | ✅ Mitigado (sessionStorage + logout limpio) |
| 3 | BOLA / IDOR | API1:2023 | CRITICAL | ✅ Mitigado (verificación por userId del JWT) |
| 4 | Control de acceso roto por función | API5:2023 / A01 | HIGH | ✅ Mitigado (ProtectedRoute + [Authorize(Roles)]) |
| 5 | Validación insuficiente / Mass Assignment | API3:2023 / A03 | HIGH | ✅ Mitigado (Zod + DataAnnotations + Rol hardcoded) |
| 6 | Exposición de secretos en bundle/código | A05:2021 / API8 | CRITICAL | ⚠️ Parcial — backend con fallback hardcodeado |
| 7 | Fuerza bruta / Rate limiting | API4:2023 | HIGH | ✅ Mitigado (60 req/min por IP) — mejorable |

### Leyenda
- ✅ **Mitigado**: control implementado y verificado en código
- ⚠️ **Parcial**: mitigación presente pero con brecha documentada
- ❌ **No mitigado**: sin control implementado

---

## Acciones Prioritarias (Producción)

1. **[CRÍTICO]** `AuthService.cs:96` — reemplazar el fallback de `Jwt:Key` por excepción explícita; mover la clave a Azure Key Vault o variable de entorno del sistema.
2. **[ALTO]** Implementar `Content-Security-Policy` en el servidor web / nginx.
3. **[ALTO]** Migrar almacenamiento de JWT a cookie `httpOnly; Secure; SameSite=Strict` con refresh token.
4. **[MEDIO]** Agregar rate limiting específico para `/api/v1/usuarios/login` (5 intentos / 15 min).
5. **[MEDIO]** Agregar `X-Content-Type-Options: nosniff` y `X-Frame-Options: DENY` en headers HTTP.
