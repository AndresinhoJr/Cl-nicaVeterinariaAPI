using ClinicaVeterinariaAPI.DTOs.Common;
using ClinicaVeterinariaAPI.DTOs.Mascotas;
using ClinicaVeterinariaAPI.Models;
using ClinicaVeterinariaAPI.Repositories;

namespace ClinicaVeterinariaAPI.Services;

public class MascotaService : IMascotaService
{
    private readonly IUnitOfWork _unitOfWork;

    public MascotaService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResultDto<MascotaResponseDto>> GetPagedAsync(
        PaginationParamsDto pagination, 
        int currentUserId, 
        string currentUserRole, 
        int? filtroDueñoId = null, 
        string? especie = null)
    {
        int? dueñoIdConsulta = currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) || 
                               currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase)
            ? filtroDueñoId 
            : currentUserId;

        var (items, totalCount) = await _unitOfWork.Mascotas.GetPagedAsync(
            pagination.Page, 
            pagination.PageSize, 
            dueñoIdConsulta, 
            especie);

        var dtos = items.Select(MapearADto);

        return new PagedResultDto<MascotaResponseDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<MascotaResponseDto?> GetByIdAsync(int id, int currentUserId, string currentUserRole)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdWithDueñoAsync(id);
        if (mascota == null) return null;

        if (!currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) && 
            !currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase) && 
            mascota.DueñoId != currentUserId)
        {
            throw new UnauthorizedAccessException("Acceso denegado: No tiene permisos para consultar esta mascota.");
        }

        return MapearADto(mascota);
    }

    public async Task<MascotaResponseDto> CreateAsync(MascotaCreateDto dto, int currentUserId, string currentUserRole)
    {
        int idDueñoAsignado = (currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) && dto.DueñoId.HasValue)
            ? dto.DueñoId.Value
            : currentUserId;

        var nuevaMascota = new Mascota
        {
            Nombre = dto.Nombre.Trim(),
            Especie = dto.Especie.Trim(),
            DueñoId = idDueñoAsignado
        };

        await _unitOfWork.Mascotas.AddAsync(nuevaMascota);
        await _unitOfWork.CommitAsync();

        var creada = await _unitOfWork.Mascotas.GetByIdWithDueñoAsync(nuevaMascota.Id);
        return MapearADto(creada!);
    }

    public async Task<MascotaResponseDto?> UpdateAsync(int id, MascotaUpdateDto dto, int currentUserId, string currentUserRole)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdWithDueñoAsync(id);
        if (mascota == null) return null;

        if (!currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) && mascota.DueñoId != currentUserId)
        {
            throw new UnauthorizedAccessException("Acceso denegado: No tiene permisos para modificar esta mascota.");
        }

        mascota.Nombre = dto.Nombre.Trim();
        mascota.Especie = dto.Especie.Trim();

        _unitOfWork.Mascotas.Update(mascota);
        await _unitOfWork.CommitAsync();

        return MapearADto(mascota);
    }

    public async Task<bool> DeleteAsync(int id, int currentUserId, string currentUserRole)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(id);
        if (mascota == null) return false;

        if (!currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) && mascota.DueñoId != currentUserId)
        {
            throw new UnauthorizedAccessException("Acceso denegado: No tiene permisos para eliminar esta mascota.");
        }

        var citas = await _unitOfWork.Citas.FindAsync(c => c.MascotaId == id);
        if (citas.Any())
        {
            throw new InvalidOperationException("No se puede eliminar la mascota porque posee citas registradas en su historial.");
        }

        _unitOfWork.Mascotas.Delete(mascota);
        await _unitOfWork.CommitAsync();
        return true;
    }

    private static MascotaResponseDto MapearADto(Mascota m)
    {
        return new MascotaResponseDto
        {
            Id = m.Id,
            Nombre = m.Nombre,
            Especie = m.Especie,
            DueñoId = m.DueñoId,
            NombreDueño = m.DueñoNavigation?.Nombre ?? "N/A",
            EmailDueño = m.DueñoNavigation?.Email ?? "N/A"
        };
    }
}

