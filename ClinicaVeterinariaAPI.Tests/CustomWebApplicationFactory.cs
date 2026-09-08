using ClinicaVeterinariaAPI.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ClinicaVeterinariaAPI.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.AddDbContext<ClinicaDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName);
            });

            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ClinicaDbContext>();

            db.Database.EnsureCreated();
            SeedData(db);
        });
    }

    private static void SeedData(ClinicaDbContext db)
    {
        var hasher = new PasswordHasher<Usuario>();

        if (!db.Roles.Any())
        {
            db.Roles.AddRange(
                new Rol { Id = 1, Nombre = "Admin" },
                new Rol { Id = 2, Nombre = "Veterinario" },
                new Rol { Id = 3, Nombre = "Cliente" }
            );
            db.SaveChanges();
        }

        if (!db.Usuarios.Any())
        {
            var admin = new Usuario { Id = 1, Nombre = "Admin Principal", Email = "admin@veterinaria.com", Rol = "Admin" };
            admin.PasswordHash = hasher.HashPassword(admin, "Password123!");

            var vet = new Usuario { Id = 2, Nombre = "Dr. Perez", Email = "vet@veterinaria.com", Rol = "Veterinario" };
            vet.PasswordHash = hasher.HashPassword(vet, "Password123!");

            var cliente1 = new Usuario { Id = 3, Nombre = "Carlos Gomez", Email = "cliente1@veterinaria.com", Rol = "Cliente" };
            cliente1.PasswordHash = hasher.HashPassword(cliente1, "Password123!");

            var cliente2 = new Usuario { Id = 4, Nombre = "Ana Lopez", Email = "cliente2@veterinaria.com", Rol = "Cliente" };
            cliente2.PasswordHash = hasher.HashPassword(cliente2, "Password123!");

            db.Usuarios.AddRange(admin, vet, cliente1, cliente2);
            db.SaveChanges();
        }

        if (!db.Mascotas.Any())
        {
            db.Mascotas.Add(
                new Mascota { Id = 1, Nombre = "Firulais", Especie = "Perro", DueñoId = 3 }
            );
            db.SaveChanges();
        }
    }
}

