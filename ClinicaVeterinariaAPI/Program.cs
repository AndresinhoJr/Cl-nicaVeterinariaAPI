using System.Text;
using System.Threading.RateLimiting;
using ClinicaVeterinariaAPI.Endpoints;
using ClinicaVeterinariaAPI.Middlewares;
using ClinicaVeterinariaAPI.Models;
using ClinicaVeterinariaAPI.Repositories;
using ClinicaVeterinariaAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

if (!builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<ClinicaDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("miconexion")));
}

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMascotaService, MascotaService>();
builder.Services.AddScoped<ICitaService, CitaService>();
builder.Services.AddScoped<ITratamientoService, TratamientoService>();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "Mi_super-clave_ultra-secreta1234_:)";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ClinicaVeterinariaApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ClinicaVeterinariaUsuarios";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero 
        };
    });

builder.Services.AddAuthorization();


builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "anonimo";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ip,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 60, 
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });
});


builder.Services.Configure<RouteOptions>(options => options.LowercaseUrls = true);
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();

// CORS — permite que el frontend React (Vite) pueda llamar a la API
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",   // Vite dev server
                "http://localhost:4173"    // Vite preview
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseMiddleware<RequestResponseLoggingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("ClinicaVeterinariaAPI - Documentación v1")
               .WithTheme(ScalarTheme.BluePlanet)
               .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
    });
}

// Aplicar CORS antes de cualquier redirección, autenticación y autorización
app.UseCors("FrontendPolicy");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Minimal APIs
app.MapUsuarioEndpoints();
app.MapMascotaEndpoints();
app.MapCitaEndpoints();
app.MapTratamientoEndpoints();
app.MapRolEndpoints();

// Seed de usuario Administrador en desarrollo si no existe
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetService<ClinicaDbContext>();
    if (context != null && !app.Environment.IsEnvironment("Testing"))
    {
        var admin = context.Usuarios.FirstOrDefault(u => u.Email == "admin@veterinaria.com");
        if (admin == null)
        {
            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<Usuario>();
            var newAdmin = new Usuario
            {
                Nombre = "Administrador",
                Email = "admin@veterinaria.com",
                Rol = "Admin"
            };
            newAdmin.PasswordHash = hasher.HashPassword(newAdmin, "admin123");
            context.Usuarios.Add(newAdmin);
            context.SaveChanges();
        }
    }
}

app.Run();

public partial class Program { }

