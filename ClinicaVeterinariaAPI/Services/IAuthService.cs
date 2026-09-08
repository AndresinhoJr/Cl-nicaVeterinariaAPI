using ClinicaVeterinariaAPI.DTOs.Auth;

namespace ClinicaVeterinariaAPI.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request);
}

