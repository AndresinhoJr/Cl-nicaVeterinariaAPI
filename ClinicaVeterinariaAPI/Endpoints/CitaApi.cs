using System.Security.Claims;
using ClinicaVeterinariaAPI.DTOs.Citas;
using ClinicaVeterinariaAPI.DTOs.Common;
using ClinicaVeterinariaAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaVeterinariaAPI.Endpoints;

public static class CitaApi
{
    public static void MapCitaEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/citas")
            .RequireAuthorization()
            .WithTags("Citas Médicas");

        group.MapGet("/", async (
            [AsParameters] PaginationParamsDto pagination,
            int? dueñoId,
            int? mascotaId,
            ClaimsPrincipal user,
            ICitaService citaService) =>
        {
            var (userId, userRole) = ObtenerIdentidad(user);
            var resultado = await citaService.GetPagedAsync(pagination, userId, userRole, dueñoId, mascotaId);
            return Results.Ok(resultado);
        })
        .WithName("ObtenerCitas")
        .Produces<PagedResultDto<CitaResponseDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/{id:int}", async (
            int id,
            ClaimsPrincipal user,
            ICitaService citaService) =>
        {
            var (userId, userRole) = ObtenerIdentidad(user);
            var cita = await citaService.GetByIdAsync(id, userId, userRole);
            if (cita == null)
            {
                return Results.NotFound(new { mensaje = $"La cita médica con id {id} no existe." });
            }

            return Results.Ok(cita);
        })
        .WithName("ObtenerCitaPorId")
        .Produces<CitaResponseDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (
            [FromBody] CitaCreateDto dto,
            ClaimsPrincipal user,
            ICitaService citaService) =>
        {
            var (userId, userRole) = ObtenerIdentidad(user);
            var nuevaCita = await citaService.CreateAsync(dto, userId, userRole);
            return Results.Created($"/api/v1/citas/{nuevaCita.Id}", nuevaCita);
        })
        .WithName("CrearCita")
        .WithValidation<CitaCreateDto>()
        .Produces<CitaResponseDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden);

        group.MapPut("/{id:int}", async (
            int id,
            [FromBody] CitaUpdateDto dto,
            ClaimsPrincipal user,
            ICitaService citaService) =>
        {
            var (userId, userRole) = ObtenerIdentidad(user);
            var actualizada = await citaService.UpdateAsync(id, dto, userId, userRole);
            if (actualizada == null)
            {
                return Results.NotFound(new { mensaje = $"La cita con id {id} no existe." });
            }

            return Results.Ok(actualizada);
        })
        .WithName("ActualizarCita")
        .WithValidation<CitaUpdateDto>()
        .Produces<CitaResponseDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:int}", async (
            int id,
            ClaimsPrincipal user,
            ICitaService citaService) =>
        {
            var (userId, userRole) = ObtenerIdentidad(user);
            var eliminada = await citaService.DeleteAsync(id, userId, userRole);
            if (!eliminada)
            {
                return Results.NotFound(new { mensaje = $"La cita con id {id} no existe." });
            }

            return Results.NoContent();
        })
        .WithName("EliminarCita")
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

