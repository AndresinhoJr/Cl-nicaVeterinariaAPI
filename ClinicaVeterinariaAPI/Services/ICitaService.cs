using ClinicaVeterinariaAPI.DTOs.Citas;
using ClinicaVeterinariaAPI.DTOs.Common;

namespace ClinicaVeterinariaAPI.Services;

public interface ICitaService
{
    Task<PagedResultDto<CitaResponseDto>> GetPagedAsync(PaginationParamsDto pagination, int currentUserId, string currentUserRole, int? filtroDueñoId = null, int? filtroMascotaId = null);
    Task<CitaResponseDto?> GetByIdAsync(int id, int currentUserId, string currentUserRole);
    Task<CitaResponseDto> CreateAsync(CitaCreateDto dto, int currentUserId, string currentUserRole);
    Task<CitaResponseDto?> UpdateAsync(int id, CitaUpdateDto dto, int currentUserId, string currentUserRole);
    Task<bool> DeleteAsync(int id, int currentUserId, string currentUserRole);
}

