using System.Security.Claims;
using ClinicaVeterinariaAPI.DTOs.Common;
using ClinicaVeterinariaAPI.DTOs.Mascotas;
using ClinicaVeterinariaAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaVeterinariaAPI.Endpoints;

public static class MascotaApi
{
    public static void MapMascotaEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/mascotas")
            .RequireAuthorization()
            .WithTags("Mascotas");

        group.MapGet("/", async (
            [AsParameters] PaginationParamsDto pagination,
            int? dueñoId,
            string? especie,
            ClaimsPrincipal user,
            IMascotaService mascotaService) =>
        {
            var (userId, userRole) = ObtenerIdentidad(user);
            var resultado = await mascotaService.GetPagedAsync(pagination, userId, userRole, dueñoId, especie);
            return Results.Ok(resultado);
        })
        .WithName("ObtenerMascotas")
        .Produces<PagedResultDto<MascotaResponseDto>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/{id:int}", async (
            int id,
            ClaimsPrincipal user,
            IMascotaService mascotaService) =>
        {
            var (userId, userRole) = ObtenerIdentidad(user);
            var mascota = await mascotaService.GetByIdAsync(id, userId, userRole);
            if (mascota == null)
            {
                return Results.NotFound(new { mensaje = $"La mascota con id {id} no fue encontrada." });
            }

            return Results.Ok(mascota);
        })
        .WithName("ObtenerMascotaPorId")
        .Produces<MascotaResponseDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        group.MapPost("/", async (
            [FromBody] MascotaCreateDto dto,
            ClaimsPrincipal user,
            IMascotaService mascotaService) =>
        {
            var (userId, userRole) = ObtenerIdentidad(user);
            var creada = await mascotaService.CreateAsync(dto, userId, userRole);
            return Results.Created($"/api/v1/mascotas/{creada.Id}", creada);
        })
        .WithName("CrearMascota")
        .WithValidation<MascotaCreateDto>()
        .Produces<MascotaResponseDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapPut("/{id:int}", async (
            int id,
            [FromBody] MascotaUpdateDto dto,
            ClaimsPrincipal user,
            IMascotaService mascotaService) =>
        {
            var (userId, userRole) = ObtenerIdentidad(user);
            var actualizada = await mascotaService.UpdateAsync(id, dto, userId, userRole);
            if (actualizada == null)
            {
                return Results.NotFound(new { mensaje = $"La mascota con id {id} no existe." });
            }

            return Results.Ok(actualizada);
        })
        .WithName("ActualizarMascota")
        .WithValidation<MascotaUpdateDto>()
        .Produces<MascotaResponseDto>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status404NotFound);

        group.MapDelete("/{id:int}", async (
            int id,
            ClaimsPrincipal user,
            IMascotaService mascotaService) =>
        {
            var (userId, userRole) = ObtenerIdentidad(user);
            var eliminada = await mascotaService.DeleteAsync(id, userId, userRole);
            if (!eliminada)
            {
                return Results.NotFound(new { mensaje = $"La mascota con id {id} no existe." });
            }

            return Results.NoContent();
        })
        .WithName("EliminarMascota")
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

