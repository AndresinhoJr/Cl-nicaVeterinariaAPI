using ClinicaVeterinariaAPI.Models;
using ClinicaVeterinariaAPI.Repositories;

namespace ClinicaVeterinariaAPI.Endpoints;

public static class RolApi
{
    public static void MapRolEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/roles")
            .RequireAuthorization()
            .WithTags("Roles");

        group.MapGet("/", async (IUnitOfWork unitOfWork) =>
        {
            var roles = await unitOfWork.Roles.GetAllAsync();
            return Results.Ok(roles);
        })
        .WithName("ObtenerRoles")
        .Produces<IEnumerable<Rol>>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized);

        group.MapGet("/{id:int}", async (int id, IUnitOfWork unitOfWork) =>
        {
            var rol = await unitOfWork.Roles.GetByIdAsync(id);
            if (rol == null)
            {
                return Results.NotFound(new { mensaje = $"El rol con id {id} no fue encontrado." });
            }

            return Results.Ok(rol);
        })
        .WithName("ObtenerRolPorId")
        .Produces<Rol>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status404NotFound);
    }
}

