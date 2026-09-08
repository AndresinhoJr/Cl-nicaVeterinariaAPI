using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaVeterinariaAPI.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(
        RequestDelegate next, 
        ILogger<GlobalExceptionMiddleware> logger, 
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción capturada en {Ruta}", context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";

        var problemDetails = new ProblemDetails
        {
            Instance = context.Request.Path
        };

        switch (exception)
        {
            case UnauthorizedAccessException:
                problemDetails.Title = "Acceso Denegado";
                problemDetails.Status = (int)HttpStatusCode.Forbidden;
                problemDetails.Detail = exception.Message;
                break;

            case KeyNotFoundException:
                problemDetails.Title = "Recurso No Encontrado";
                problemDetails.Status = (int)HttpStatusCode.NotFound;
                problemDetails.Detail = exception.Message;
                break;

            case InvalidOperationException:
            case ArgumentException:
                problemDetails.Title = "Solicitud Inválida";
                problemDetails.Status = (int)HttpStatusCode.BadRequest;
                problemDetails.Detail = exception.Message;
                break;

            default:
                problemDetails.Title = "Error Interno del Servidor";
                problemDetails.Status = (int)HttpStatusCode.InternalServerError;
                problemDetails.Detail = _env.IsDevelopment() 
                    ? exception.Message 
                    : "Ha ocurrido un error inesperado al procesar su solicitud.";
                break;
        }

        context.Response.StatusCode = problemDetails.Status.Value;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, options));
    }
}

