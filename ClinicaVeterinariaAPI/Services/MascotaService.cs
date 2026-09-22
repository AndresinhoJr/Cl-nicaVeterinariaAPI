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
        int idDueñoAsignado;
        bool esAdminOVet = currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                           currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase);

        if (esAdminOVet)
        {
            if (!dto.DueñoId.HasValue || dto.DueñoId.Value <= 0)
            {
                throw new ArgumentException("Debe seleccionar un dueño para registrar la mascota.");
            }

            var dueño = await _unitOfWork.Usuarios.GetByIdAsync(dto.DueñoId.Value);
            if (dueño == null)
            {
                throw new KeyNotFoundException($"El cliente con id {dto.DueñoId.Value} no existe.");
            }

            idDueñoAsignado = dto.DueñoId.Value;
        }
        else
        {
            idDueñoAsignado = currentUserId;
        }

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

        bool esAdminOVet = currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                           currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase);

        if (!esAdminOVet && mascota.DueñoId != currentUserId)
        {
            throw new UnauthorizedAccessException("Acceso denegado: No tiene permisos para modificar esta mascota.");
        }

        mascota.Nombre = dto.Nombre.Trim();
        mascota.Especie = dto.Especie.Trim();

        if (esAdminOVet && dto.DueñoId.HasValue && dto.DueñoId.Value > 0)
        {
            var dueño = await _unitOfWork.Usuarios.GetByIdAsync(dto.DueñoId.Value);
            if (dueño != null)
            {
                mascota.DueñoId = dto.DueñoId.Value;
            }
        }

        _unitOfWork.Mascotas.Update(mascota);
        await _unitOfWork.CommitAsync();

        var actualizada = await _unitOfWork.Mascotas.GetByIdWithDueñoAsync(mascota.Id);
        return MapearADto(actualizada!);
    }

    public async Task<bool> DeleteAsync(int id, int currentUserId, string currentUserRole)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdAsync(id);
        if (mascota == null) return false;

        bool esAdminOVet = currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                           currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase);

        if (!esAdminOVet && mascota.DueñoId != currentUserId)
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

