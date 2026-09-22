using ClinicaVeterinariaAPI.DTOs.Auth;

namespace ClinicaVeterinariaAPI.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<ClienteDto> CrearClienteAsync(CrearUsuarioDto request);
    Task<UsuarioDto> CrearVeterinarioAsync(CrearUsuarioDto request);
    Task<bool> CambiarPasswordAsync(int userId, string passwordActual, string nuevoPassword);
    Task<IEnumerable<UsuarioDto>> ObtenerTodosUsuariosAsync();
}
