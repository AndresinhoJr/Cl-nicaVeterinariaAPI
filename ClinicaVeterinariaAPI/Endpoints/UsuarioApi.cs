using ClinicaVeterinariaAPI.DTOs.Auth;
using ClinicaVeterinariaAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaVeterinariaAPI.Endpoints;

public static class UsuarioApi
{
    public static void MapUsuarioEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/v1/usuarios")
            .WithTags("Usuarios y Autenticación");

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

        group.MapPost("/registro", async ([FromBody] RegisterRequestDto request, IAuthService authService) =>
        {
            var response = await authService.RegisterAsync(request);
            return Results.Created("/api/v1/usuarios", response);
        })
        .WithName("RegistroUsuario")
        .WithValidation<RegisterRequestDto>()
        .Produces<LoginResponseDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest);
    }
}
