using System.ComponentModel.DataAnnotations;

namespace ClinicaVeterinariaAPI.Endpoints;

public class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var arg = context.Arguments.OfType<T>().FirstOrDefault();
        if (arg != null)
        {
            var validationContext = new ValidationContext(arg, context.HttpContext.RequestServices, null);
            var validationResults = new List<ValidationResult>();
            if (!Validator.TryValidateObject(arg, validationContext, validationResults, true))
            {
                var errors = new Dictionary<string, string[]>();
                foreach (var result in validationResults)
                {
                    foreach (var memberName in result.MemberNames.DefaultIfEmpty(string.Empty))
                    {
                        var key = string.IsNullOrEmpty(memberName) ? "General" : memberName;
                        if (!errors.ContainsKey(key))
                        {
                            errors[key] = [];
                        }
                        errors[key] = [.. errors[key], result.ErrorMessage ?? "Error de validación"];
                    }
                }
                return Results.ValidationProblem(
                    errors, 
                    title: "Ocurrieron uno o más errores de validación.", 
                    detail: "Por favor revisa y corrige los campos del formulario antes de continuar.");
            }
        }
        return await next(context);
    }
}

public static class ValidationExtensions
{
    public static RouteHandlerBuilder WithValidation<T>(this RouteHandlerBuilder builder) where T : class
    {
        return builder.AddEndpointFilter<ValidationFilter<T>>();
    }
}

