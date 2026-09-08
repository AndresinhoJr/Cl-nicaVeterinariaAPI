using ClinicaVeterinariaAPI.DTOs.Common;
using ClinicaVeterinariaAPI.DTOs.Mascotas;

namespace ClinicaVeterinariaAPI.Services;

public interface IMascotaService
{
    Task<PagedResultDto<MascotaResponseDto>> GetPagedAsync(PaginationParamsDto pagination, int currentUserId, string currentUserRole, int? filtroDueñoId = null, string? especie = null);
    Task<MascotaResponseDto?> GetByIdAsync(int id, int currentUserId, string currentUserRole);
    Task<MascotaResponseDto> CreateAsync(MascotaCreateDto dto, int currentUserId, string currentUserRole);
    Task<MascotaResponseDto?> UpdateAsync(int id, MascotaUpdateDto dto, int currentUserId, string currentUserRole);
    Task<bool> DeleteAsync(int id, int currentUserId, string currentUserRole);
}

