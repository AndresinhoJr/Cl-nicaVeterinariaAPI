using System.Security.Claims;
using ClinicaVeterinariaAPI.DTOs.Auth;
using ClinicaVeterinariaAPI.Repositories;
using ClinicaVeterinariaAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaVeterinariaAPI.Endpoints;

public static class UsuarioApi
{
    public static void MapUsuarioEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/usuarios")
            .WithTags("Usuarios y Autenticación");

        // Login (público)
        group.MapPost("/login", async ([FromBody] LoginRequestDto request, IAuthService authService) =>
        {
            var response = await authService.LoginAsync(request);
            if (response == null)
            {
                return Results.Unauthorized();
            }

            return Results.Ok(response);
        })
        .WithName("LoginUsuario")
        .WithValidation<LoginRequestDto>()
        .Produces<LoginResponseDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized);

        // Registro heredado (se mantiene por compatibilidad)
        group.MapPost("/registro", async ([FromBody] RegisterRequestDto request, IAuthService authService) =>
        {
            var response = await authService.RegisterAsync(request);
            return Results.Created("/api/v1/usuarios", response);
        })
        .WithName("RegistroUsuario")
        .WithValidation<RegisterRequestDto>()
        .Produces<LoginResponseDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest);

        // Obtener clientes registrados (Admin y Veterinario)
        group.MapGet("/clientes", async (IUnitOfWork unitOfWork) =>
        {
            var clientes = await unitOfWork.Usuarios.FindAsync(u => u.Rol == "Cliente");
            var result = clientes
                .OrderBy(u => u.Nombre)
                .Select(u => new ClienteDto
                {
                    Id = u.Id,
                    Nombre = u.Nombre,
                    Email = u.Email
                });
            return Results.Ok(result);
        })
        .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin,Veterinario" })
        .WithName("ObtenerClientes")
        .Produces<IEnumerable<ClienteDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden);

        // Crear Cliente (Admin y Veterinario inscriben nuevos dueños)
        group.MapPost("/crear-cliente", async ([FromBody] CrearUsuarioDto request, IAuthService authService) =>
        {
            var nuevoCliente = await authService.CrearClienteAsync(request);
            return Results.Created($"/api/v1/usuarios/{nuevoCliente.Id}", nuevoCliente);
        })
        .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin,Veterinario" })
        .WithName("CrearCliente")
        .WithValidation<CrearUsuarioDto>()
        .Produces<ClienteDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden);

        // Crear Veterinario (Solo Admin puede dar de alta personal médico)
        group.MapPost("/crear-veterinario", async ([FromBody] CrearUsuarioDto request, IAuthService authService) =>
        {
            var nuevoVet = await authService.CrearVeterinarioAsync(request);
            return Results.Created($"/api/v1/usuarios/{nuevoVet.Id}", nuevoVet);
        })
        .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin" })
        .WithName("CrearVeterinario")
        .WithValidation<CrearUsuarioDto>()
        .Produces<UsuarioDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden);

        // Listar todos los usuarios del sistema (Solo Admin)
        group.MapGet("/", async (IAuthService authService) =>
        {
            var usuarios = await authService.ObtenerTodosUsuariosAsync();
            return Results.Ok(usuarios);
        })
        .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin" })
        .WithName("ObtenerTodosLosUsuarios")
        .Produces<IEnumerable<UsuarioDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden);

        // Cambiar contraseña (Cualquier usuario autenticado)
        group.MapPut("/cambiar-password", async (
            [FromBody] CambiarPasswordDto request, 
            ClaimsPrincipal user, 
            IAuthService authService) =>
        {
            var idClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(idClaim, out int userId) || userId <= 0)
            {
                return Results.Unauthorized();
            }

            await authService.CambiarPasswordAsync(userId, request.PasswordActual, request.NuevoPassword);
            return Results.Ok(new { mensaje = "Contraseña actualizada exitosamente." });
        })
        .RequireAuthorization()
        .WithName("CambiarPassword")
        .WithValidation<CambiarPasswordDto>()
        .Produces(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized);
    }
}
