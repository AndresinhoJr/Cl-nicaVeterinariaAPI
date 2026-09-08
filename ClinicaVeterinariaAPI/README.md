# Proyecto API Clínica Veterinaria

API construida con ASP.NET Core 10 (Minimal APIs), Entity Framework Core, autenticación JWT y documentación interactiva con Scalar.

## Entidades y Modelo de Datos
- **Usuarios** (`id`, `nombre`, `email`, `rol`)
- **Mascotas** (`id`, `nombre`, `especie`, `dueño_id`)
- **Citas** (`id`, `mascota_id`, `fecha`, `motivo`)
- **Tratamientos** (`id`, `cita_id`, `descripción`, `costo`)
- **Roles** (`id`, `nombre`)

## Librerías instaladas
- `scalar.aspnetcore`
- `microsoft.entityframeworkcore.sqlserver`
- `microsoft.entityframeworkcore.tools`
- `microsoft.entityframeworkcore.design`
- `microsoft.openapi`
- `microsoft.aspnetcore.authentication.jwtbearer`

## Creación y Conexión de Base de Datos (SQL Server)
Ejecutar el script `veterinariadb.sql` en SQL Server Management Studio o consola.

### Cadena de conexión:
#### Sin autenticación de usuario (Windows Authentication):
	Scaffold-DbContext "server=.\sqlexpress; Initial Catalog=veterinariadb;Trusted_Connection=True;TrustServerCertificate=True;" Microsoft.EntityFrameworkCore.SqlServer -OutputDir Models
#### Con autenticación de usuario (SQL Authentication):
	Scaffold-DbContext "server=.\sqlexpress; Initial Catalog=veterinariadb; user id=sa; password=ipvg2026;TrustServerCertificate=True;" Microsoft.EntityFrameworkCore.SqlServer -OutputDir Models

## Documentación interactiva
Al iniciar el proyecto en modo desarrollo, acceder a la documentación interactiva en:
- `http://localhost:5237/scalar/v1`
