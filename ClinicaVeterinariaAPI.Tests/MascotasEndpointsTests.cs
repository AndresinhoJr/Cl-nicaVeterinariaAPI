using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ClinicaVeterinariaAPI.DTOs.Auth;
using ClinicaVeterinariaAPI.DTOs.Mascotas;

namespace ClinicaVeterinariaAPI.Tests;

public class MascotasEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public MascotasEndpointsTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task<string> ObtenerTokenAsync(string email, string password = "Password123!")
    {
        var loginDto = new LoginRequestDto
        {
            Email = email,
            Password = password
        };

        var response = await _client.PostAsJsonAsync("/api/v1/usuarios/login", loginDto);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
        return result!.Token;
    }

    [Fact]
    public async Task Post_Mascota_SinToken_Retorna401Unauthorized()
    {
        // Arrange (sin cabecera Authorization)
        var dto = new
        {
            nombre = "Canela",
            especie = "Roedor"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/mascotas", dto);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Post_Mascota_ConEspecieInvalida_Retorna400BadRequest()
    {
        // Arrange
        var token = await ObtenerTokenAsync("cliente1@veterinaria.com");
        var clientWithAuth = CreateClientWithAuth(token);

        var dtoInvalido = new
        {
            nombre = "Canela",
            especie = "Hanster" // Especie no admitida en las reglas del DTO
        };

        // Act
        var response = await clientWithAuth.PostAsJsonAsync("/api/v1/mascotas", dtoInvalido);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_Mascota_ConClienteAutenticado_Retorna201CreatedYAsignaSuPropioId()
    {
        // Arrange: Cliente 1 (Id: 3)
        var token = await ObtenerTokenAsync("cliente1@veterinaria.com");
        var clientWithAuth = CreateClientWithAuth(token);

        var dto = new MascotaCreateDto
        {
            Nombre = "Rocky Balboa",
            Especie = "Perro",
            DueñoId = 999 // Debe ser ignorado por seguridad BOLA
        };

        // Act
        var response = await clientWithAuth.PostAsJsonAsync("/api/v1/mascotas", dto);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var creada = await response.Content.ReadFromJsonAsync<MascotaResponseDto>();
        Assert.NotNull(creada);
        Assert.Equal("Rocky Balboa", creada.Nombre);
        Assert.Equal("Perro", creada.Especie);
        Assert.Equal(3, creada.DueñoId); // Asignado a cliente1 (Id: 3) por el token
    }

    [Fact]
    public async Task Get_Mascota_DeOtroDueño_Retorna403Forbidden()
    {
        // Arrange: La mascota con Id 1 pertenece a cliente1 (Id: 3)
        // Intentamos consultarla autenticados como cliente2 (Id: 4)
        var tokenCliente2 = await ObtenerTokenAsync("cliente2@veterinaria.com");
        var clientWithAuth = CreateClientWithAuth(tokenCliente2);

        // Act
        var response = await clientWithAuth.GetAsync("/api/v1/mascotas/1");

        // Assert (OWASP API1: BOLA)
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Get_Mascota_ConRolAdmin_Retorna200OK()
    {
        // Arrange: Un usuario con rol Admin consulta la mascota 1 de otro usuario
        var tokenAdmin = await ObtenerTokenAsync("admin@veterinaria.com");
        var clientWithAuth = CreateClientWithAuth(tokenAdmin);

        // Act
        var response = await clientWithAuth.GetAsync("/api/v1/mascotas/1");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var mascota = await response.Content.ReadFromJsonAsync<MascotaResponseDto>();
        Assert.NotNull(mascota);
        Assert.Equal(1, mascota.Id);
    }

    private HttpClient CreateClientWithAuth(string token)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
