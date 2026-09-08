# Proyecto API Clínica Veterinaria 🐾

API REST construida con **ASP.NET Core 10** utilizando arquitectura moderna basada en **Minimal APIs (Endpoints)**, **Entity Framework Core**, autenticación segura con **JWT**, rate limiting y documentación interactiva con **Scalar**.

---

## 🚀 Arquitectura y Características
- **Minimal APIs (Endpoints Grouping)**: Estructura modular y desacoplada mediante extensiones `MapGroup` para cada recurso en lugar de controladores clásicos.
- **Patrón Repository y Unit of Work**: Separación de la capa de acceso a datos y lógica de negocio (`Repositories` y `Services`).
- **Autenticación y Autorización JWT**: Protección de rutas mediante tokens JWT y control de roles (`Admin`, `Veterinario`, `Cliente`).
- **Pruebas Automatizadas (xUnit)**: Proyecto `ClinicaVeterinariaAPI.Tests` con WebApplicationFactory para pruebas de integración y unitarias de endpoints.
- **Middlewares personalizados**:
  - `GlobalExceptionMiddleware`: Manejo uniforme de errores bajo el estándar RFC 7807 (ProblemDetails).
  - `RequestResponseLoggingMiddleware`: Auditoría y registro de peticiones HTTP.
- **Seguridad**: Rate Limiting implementado para mitigar ataques de denegación de servicio.
- **Documentación Interactiva**: Integración de OpenAPI con interfaz Scalar (`/scalar/v1`).

---

## 📁 Estructura del Proyecto

```text
├── ClinicaVeterinariaAPI/          # Proyecto principal de la API
│   ├── DTOs/                       # Data Transfer Objects
│   ├── Endpoints/                  # Minimal APIs agrupadas (Usuario, Mascota, Cita, etc.)
│   ├── Middlewares/                # Filtros y Middlewares globales
│   ├── Migrations/                 # Migraciones de base de datos
│   ├── Models/                     # Entidades del dominio y DbContext
│   ├── Repositories/               # Patrón Repository & UnitOfWork
│   ├── Services/                   # Lógica de negocio e interfaces
│   ├── Program.cs                  # Configuración de servicios y pipeline HTTP
│   └── appsettings.json            # Cadenas de conexión y configuración JWT
├── ClinicaVeterinariaAPI.Tests/    # Suite de pruebas automatizadas (xUnit)
├── docs/                           # Documentación de entrega (Informe y Presentación)
├── ClinicaVeterinariaAPI.sln       # Solución de Visual Studio
├── veterinariadb.sql               # Script de creación y población de BD SQL Server
└── README.md                       # Documentación general
```

---

## 🗄️ Base de Datos (SQL Server)

1. Ejecutar el script `veterinariadb.sql` en SQL Server Management Studio o mediante línea de comandos.
2. Asegurarse de configurar la cadena de conexión en `ClinicaVeterinariaAPI/appsettings.json`:
```json
"ConnectionStrings": {
  "miconexion": "server=.\\sqlexpress; Initial Catalog=veterinariadb;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

---

## 🧪 Pruebas Unitarias

Para ejecutar la suite de pruebas automatizadas:
```bash
dotnet test
```

---

## 💻 Ejecución del Proyecto

1. Restaurar dependencias y compilar:
```bash
dotnet build
```
2. Ejecutar la API:
```bash
dotnet run --project ClinicaVeterinariaAPI
```
3. Abrir la documentación interactiva Scalar en el navegador:
   - `http://localhost:5237/scalar/v1`
