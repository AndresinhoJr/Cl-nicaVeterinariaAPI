using ClinicaVeterinariaAPI.DTOs.Tratamientos;

namespace ClinicaVeterinariaAPI.Services;

public interface ITratamientoService
{
    Task<IEnumerable<TratamientoResponseDto>> GetByCitaIdAsync(int citaId, int currentUserId, string currentUserRole);
    Task<TratamientoResponseDto> CreateAsync(TratamientoCreateDto dto);
    Task<bool> DeleteAsync(int id);
}

