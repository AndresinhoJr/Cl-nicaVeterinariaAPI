using System.Diagnostics;

namespace ClinicaVeterinariaAPI.Middlewares;


public class RequestResponseLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestResponseLoggingMiddleware> _logger;

    public RequestResponseLoggingMiddleware(RequestDelegate next, ILogger<RequestResponseLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        const string correlationHeader = "X-Correlation-Id";
        if (!context.Request.Headers.TryGetValue(correlationHeader, out var correlationId))
        {
            correlationId = Guid.NewGuid().ToString("N");
            context.Response.Headers.Append(correlationHeader, correlationId);
        }

        var stopwatch = Stopwatch.StartNew();
        var metodo = context.Request.Method;
        var ruta = context.Request.Path;
        var ipCliente = context.Connection.RemoteIpAddress?.ToString() ?? "Desconocida";

        _logger.LogInformation(
            "[{CorrelationId}] INICIO {Metodo} {Ruta} desde {IpCliente}",
            correlationId, metodo, ruta, ipCliente);

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var statusCode = context.Response.StatusCode;

            _logger.LogInformation(
                "[{CorrelationId}] FIN {Metodo} {Ruta} respondió {StatusCode} en {ElapsedMs}ms",
                correlationId, metodo, ruta, statusCode, stopwatch.ElapsedMilliseconds);
        }
    }
}

