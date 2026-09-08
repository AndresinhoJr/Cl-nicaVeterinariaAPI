using System.Security.Claims;
using ClinicaVeterinariaAPI.DTOs.Tratamientos;
using ClinicaVeterinariaAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaVeterinariaAPI.Endpoints;

public static class TratamientoApi
{
    public static void MapTratamientoEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/tratamientos")
            .RequireAuthorization()
            .WithTags("Tratamientos Médicos");

        group.MapGet("/cita/{citaId:int}", async (
            int citaId,
            ClaimsPrincipal user,
            ITratamientoService tratamientoService) =>
        {
            var (userId, userRole) = ObtenerIdentidad(user);
            var tratamientos = await tratamientoService.GetByCitaIdAsync(citaId, userId, userRole);
            return Results.Ok(tratamientos);
        })
        .WithName("ObtenerTratamientosPorCita")
        .Produces<IEnumerable<TratamientoResponseDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (
            [FromBody] TratamientoCreateDto dto,
            ITratamientoService tratamientoService) =>
        {
            var creado = await tratamientoService.CreateAsync(dto);
            return Results.Created($"/api/v1/tratamientos/{creado.Id}", creado);
        })
        .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin,Veterinario" })
        .WithName("CrearTratamiento")
        .WithValidation<TratamientoCreateDto>()
        .Produces<TratamientoResponseDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:int}", async (
            int id,
            ITratamientoService tratamientoService) =>
        {
            var eliminado = await tratamientoService.DeleteAsync(id);
            if (!eliminado)
            {
                return Results.NotFound(new { mensaje = $"El tratamiento con id {id} no existe." });
            }

            return Results.NoContent();
        })
        .RequireAuthorization(new AuthorizeAttribute { Roles = "Admin,Veterinario" })
        .WithName("EliminarTratamiento")
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);
    }

    private static (int UserId, string UserRole) ObtenerIdentidad(ClaimsPrincipal user)
    {
        var idClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
        int userId = int.TryParse(idClaim, out int parsedId) ? parsedId : 0;
        var userRole = user.FindFirstValue(ClaimTypes.Role) ?? "Cliente";
        return (userId, userRole);
    }
}

