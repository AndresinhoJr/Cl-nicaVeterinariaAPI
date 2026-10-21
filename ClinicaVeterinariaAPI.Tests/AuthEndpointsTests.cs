using System.Net;
using System.Net.Http.Json;
using ClinicaVeterinariaAPI.DTOs.Auth;

namespace ClinicaVeterinariaAPI.Tests;

public class AuthEndpointsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthEndpointsTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Post_Login_ConCredencialesValidas_Retorna200YToken()
    {
        // Arrange
        var loginDto = new LoginRequestDto
        {
            Email = "cliente1@veterinaria.com",
            Password = "Password123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/usuarios/login", loginDto);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal("cliente1@veterinaria.com", result.Email);
        Assert.Equal("Cliente", result.Rol);
    }

    [Fact]
    public async Task Post_Login_ConCredencialesInvalidas_Retorna401Unauthorized()
    {
        // Arrange
        var loginDto = new LoginRequestDto
        {
            Email = "cliente1@veterinaria.com",
            Password = "PasswordEquivocado"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/usuarios/login", loginDto);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Post_Registro_ConDatosValidos_Retorna201Created()
    {
        // Arrange
        var registerDto = new RegisterRequestDto
        {
            Nombre = "Nuevo Usuario Test",
            Email = $"nuevo_{Guid.NewGuid():N}@test.com",
            Password = "PasswordSeguro123!"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/v1/usuarios/registro", registerDto);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal("Cliente", result.Rol);
    }

    [Fact]
    public async Task Post_Login_ExcedeLimiteDeIntentos_Retorna429TooManyRequests()
    {
        // Arrange: Cliente con IP aislada para verificar Rate Limiting de 5 intentos por minuto
        using var isolatedClient = _client;
        var requestMessageFactory = () =>
        {
            var req = new HttpRequestMessage(HttpMethod.Post, "/api/v1/usuarios/login")
            {
                Content = JsonContent.Create(new LoginRequestDto
                {
                    Email = "bruteforce_test@veterinaria.com",
                    Password = "ClaveIncorrecta123"
                })
            };
            req.Headers.Add("X-Forwarded-For", "203.0.113.195");
            return req;
        };

        HttpResponseMessage? response = null;

        // Act: Enviar 6 peticiones consecutivas (el límite estándar OWASP es 5)
        for (int i = 0; i < 6; i++)
        {
            using var request = requestMessageFactory();
            response = await _client.SendAsync(request);
        }

        // Assert: El 6to intento es bloqueado con HTTP 429 Too Many Requests
        Assert.NotNull(response);
        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
    }
}

