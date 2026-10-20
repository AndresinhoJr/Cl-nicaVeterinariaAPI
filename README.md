# Sistema de Gestión — Clínica Veterinaria 🐾

Sistema web full-stack para la gestión integral de una clínica veterinaria, compuesto por una **API REST moderna con ASP.NET Core 10** y un **Frontend SPA en React 19 con TypeScript, Vite y Tailwind CSS**. Cumple con estándares de seguridad **OWASP Top 10** y accesibilidad **WCAG 2.2 Nivel AA**.

---

## 🏛️ Arquitectura del Sistema

El proyecto está organizado en un monorepo desacoplado:

```text
├── ClinicaVeterinariaAPI/          # Backend RESTful (ASP.NET Core 10 Minimal APIs)
│   ├── DTOs/                       # Data Transfer Objects validados
│   ├── Endpoints/                  # Minimal APIs agrupadas (Mascota, Cita, Tratamiento, Usuario)
│   ├── Middlewares/                # GlobalException (RFC 7807) y RequestLogging
│   ├── Models/                     # Entidades de dominio y DbContext EF Core
│   ├── Repositories/               # Patrón Repository & Unit of Work
│   ├── Services/                   # Lógica de negocio, contraseñas y JWT
│   ├── appsettings.Example.json    # Plantilla de configuración sin credenciales reales
│   └── Program.cs                  # Pipeline HTTP, CORS, Rate Limiter (60 req/min)
├── ClinicaVeterinariaAPI.Tests/    # Suite de integración backend (xUnit + WebApplicationFactory)
├── frontend/                       # Frontend SPA (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── api/                    # Cliente centralizado Axios con interceptores JWT
│   │   ├── context/                # AuthContext para sesión y control de roles
│   │   ├── features/               # Módulos: mascotas, citas, tratamientos
│   │   ├── components/             # UI reutilizable: Navbar, ProtectedRoute, SkipLink, Icons
│   │   ├── pages/                  # Vistas: LoginPage, AdminPage, UnauthorizedPage
│   │   └── index.css               # Design system global con paleta Tailwind CSS
│   ├── e2e/                        # Pruebas End-to-End con Playwright
│   ├── .env.example                # Variables de entorno frontend
│   └── playwright.config.ts        # Configuración Playwright (Chromium & Mobile)
├── docs/                           # Documentación técnica de entrega
│   ├── INFORME_TECNICO.md          # Informe técnico y justificación de arquitectura
│   ├── MATRIZ_RIESGOS_OWASP.md     # Matriz de riesgos mitigados según OWASP
│   ├── BITACORA_IA.md              # Bitácora detallada de prompts y herramientas IA
│   └── ESTRUCTURA_PRESENTACION.md  # Guion de diapositivas para la defensa final
├── AI_LOG.md                       # Bitácora de uso de IA (raíz del repositorio)
├── veterinariadb.sql               # Script de base de datos SQL Server
└── README.md                       # Documentación principal
```

---

## 🔐 Seguridad y Mitigaciones OWASP

* **OWASP A01 (Broken Object Level Authorization - BOLA):**
  * Validación estricta a nivel de servicio (`MascotaService`). Los clientes solo acceden y gestionan sus propias mascotas, ignorando cualquier manipulación de `dueñoId` en el payload.
* **OWASP A02 (Cryptographic Failures):**
  * Contraseñas protegidas mediante `PasswordHasher<T>` con PBKDF2 y sal criptográfica única.
  * Tokens JWT firmados con HMAC-SHA256 y expiración de 60 minutos.
* **OWASP A03 (Injection / XSS):**
  * Backend: Consultas parametrizadas vía Entity Framework Core y Dapper (inmunidad contra SQL Injection).
  * Frontend: Renderizado estricto mediante nodos de texto de React (0 ocurrencias de `dangerouslySetInnerHTML` ni `innerHTML`).
* **OWASP A04 & A05 (Security Misconfiguration & Rate Limiting):**
  * Rate Limiter global por IP configurado a **60 peticiones/minuto** (retorna HTTP 429 Too Many Requests).
  * Política CORS restrictiva (`FrontendPolicy`) limitando los orígenes autorizados a los puertos de desarrollo del frontend (`http://localhost:5173` y `http://localhost:4173`).
* **Almacenamiento seguro del Token:**
  * El JWT se almacena exclusivamente en `sessionStorage` (destruido automáticamente al cerrar la pestaña/navegador). No persiste en `localStorage` ni en cookies vulnerables.

---

## ♿ Accesibilidad y Diseño Responsivo (WCAG 2.2 AA)

* **2.4.1 Bypass Blocks:** Enlace "Saltar al contenido principal" accesible exclusivamente con la tecla `Tab`.
* **1.4.3 Contraste de Color:** Ratios superiores a 4.5:1 sobre la paleta moderna de Tailwind CSS (Slate-950 / Sky-500).
* **3.3.1 & 3.3.2 Formularios Accesibles:** Atributos `aria-invalid`, `aria-describedby` y anuncios reactivos con `role="alert"` y `aria-live="polite"`.
* **1.4.10 Reflow (Responsividad):** Diseño adaptable fluido verificado en móviles (320px–390px), tabletas (768px) y escritorio sin desplazamiento horizontal involuntario.

---

## 👥 Credenciales de Prueba

La base de datos cuenta con los siguientes roles y accesos preconfigurados:

| Rol | Usuario / Email | Contraseña | Capacidades |
|---|---|---|---|
| **Administrador** | `admin@veterinaria.com` | `admin123` | Gestión global, registro de veterinarios y clientes, administración total de fichas. |
| **Veterinario** | `juan.perez@veterinaria.com` | `vet123` | Registro de pacientes, control de citas, recetas y tratamientos clínicos. |
| **Cliente** | `maria.gonzalez@gmail.com` | `cliente123` | Consulta de sus mascotas registradas, citas médicas y recetas asignadas. |

---

## ⚙️ Requisitos Previos

* **.NET SDK 10.0** (o superior).
* **Node.js 20+** y `npm`.
* **SQL Server Express** o LocalDB.

---

## 🚀 Instalación y Puesta en Marcha

### 1. Base de Datos
1. Ejecutar el script `veterinariadb.sql` en SQL Server Management Studio o mediante línea de comandos:
   ```bash
   sqlcmd -S .\sqlexpress -i veterinariadb.sql
   ```
2. Verificar la cadena de conexión en `ClinicaVeterinariaAPI/appsettings.json` (usar como guía `appsettings.Example.json`).

### 2. Backend (API REST)
```bash
cd ClinicaVeterinariaAPI
dotnet restore
dotnet run
```
* La API iniciará en: `http://localhost:5237`
* Documentación interactiva Scalar disponible en: `http://localhost:5237/scalar/v1`

### 3. Frontend (React 19)
En una nueva terminal:
```bash
cd frontend
npm install
npm run dev
```
* La aplicación cargará en: `http://localhost:5173`

---

## 🧪 Ejecución de Pruebas Automatizadas

El proyecto cuenta con un 100% de cobertura funcional en tres niveles:

### 1. Pruebas de Integración Backend (xUnit)
Evalúan endpoints Minimal API, serialización DTO, autenticación JWT y mitigación BOLA:
```bash
dotnet test ClinicaVeterinariaAPI.Tests
# Resultado: 8 superadas (100% verde)
```

### 2. Pruebas Unitarias y de Componentes Frontend (Vitest)
Evalúan renderizado accesible, validaciones de esquema Zod, manejo de estado y mocks con MSW:
```bash
cd frontend
npm run test
# Resultado: 25 superadas (100% verde)
```

### 3. Pruebas End-to-End Reales (Playwright)
Ejecutan navegadores reales (Chromium Desktop y Mobile Chrome) validando login, flujo CRUD, logout y responsividad móvil (375px):
```bash
cd frontend
npx playwright test
# Resultado: 14 superadas en Chromium y Mobile (100% verde)
```

---

## 📄 Documentación Técnica Incluida

* **[Informe Técnico Completo](docs/INFORME_TECNICO.md):** Decisiones de arquitectura, manejo de estado y justificación técnica.
* **[Matriz de Riesgos OWASP](docs/MATRIZ_RIESGOS_OWASP.md):** Auditoría detallada con líneas exactas de código y evidencias de mitigación.
* **[Bitácora de Uso de IA](AI_LOG.md):** Declaración de herramientas, modelos empleados (Gemini 2.5 Pro / Claude 3.5 Sonnet) y registro de prompts.
* **[Guion para Presentación](docs/ESTRUCTURA_PRESENTACION.md):** Estructura diapositiva por diapositiva para la defensa oral del proyecto.
