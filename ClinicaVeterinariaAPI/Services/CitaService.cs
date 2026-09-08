using ClinicaVeterinariaAPI.DTOs.Citas;
using ClinicaVeterinariaAPI.DTOs.Common;
using ClinicaVeterinariaAPI.Models;
using ClinicaVeterinariaAPI.Repositories;

namespace ClinicaVeterinariaAPI.Services;

public class CitaService : ICitaService
{
    private readonly IUnitOfWork _unitOfWork;

    public CitaService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResultDto<CitaResponseDto>> GetPagedAsync(
        PaginationParamsDto pagination, 
        int currentUserId, 
        string currentUserRole, 
        int? filtroDueñoId = null, 
        int? filtroMascotaId = null)
    {
        int? dueñoIdConsulta = (currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                               currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase))
            ? filtroDueñoId
            : currentUserId;

        var (items, totalCount) = await _unitOfWork.Citas.GetPagedAsync(
            pagination.Page, 
            pagination.PageSize, 
            dueñoIdConsulta, 
            filtroMascotaId);

        var dtos = items.Select(MapearADto);

        return new PagedResultDto<CitaResponseDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<CitaResponseDto?> GetByIdAsync(int id, int currentUserId, string currentUserRole)
    {
        var cita = await _unitOfWork.Citas.GetByIdWithDetailsAsync(id);
        if (cita == null) return null;

        if (!currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
            !currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase) &&
            cita.MascotaNavigation.DueñoId != currentUserId)
        {
            throw new UnauthorizedAccessException("Acceso denegado: No tiene permisos para consultar esta cita.");
        }

        return MapearADto(cita);
    }

    public async Task<CitaResponseDto> CreateAsync(CitaCreateDto dto, int currentUserId, string currentUserRole)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdWithDueñoAsync(dto.MascotaId);
        if (mascota == null)
        {
            throw new KeyNotFoundException($"La mascota con id {dto.MascotaId} no existe.");
        }

        if (!currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
            !currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase) &&
            mascota.DueñoId != currentUserId)
        {
            throw new UnauthorizedAccessException("Acceso denegado: No puede agendar citas para una mascota que no le pertenece.");
        }

        bool conflicto = await _unitOfWork.Citas.ExisteConflictoHorarioAsync(dto.MascotaId, dto.Fecha);
        if (conflicto)
        {
            throw new InvalidOperationException("La mascota ya tiene una cita médica programada en un horario cercano (rango de 30 minutos).");
        }

        var nuevaCita = new Cita
        {
            MascotaId = dto.MascotaId,
            Fecha = dto.Fecha,
            Motivo = dto.Motivo.Trim()
        };

        await _unitOfWork.Citas.AddAsync(nuevaCita);
        await _unitOfWork.CommitAsync();

        var creada = await _unitOfWork.Citas.GetByIdWithDetailsAsync(nuevaCita.Id);
        return MapearADto(creada!);
    }

    public async Task<CitaResponseDto?> UpdateAsync(int id, CitaUpdateDto dto, int currentUserId, string currentUserRole)
    {
        var cita = await _unitOfWork.Citas.GetByIdWithDetailsAsync(id);
        if (cita == null) return null;

        if (!currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
            !currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase) &&
            cita.MascotaNavigation.DueñoId != currentUserId)
        {
            throw new UnauthorizedAccessException("Acceso denegado: No tiene permisos para modificar esta cita.");
        }

        bool conflicto = await _unitOfWork.Citas.ExisteConflictoHorarioAsync(cita.MascotaId, dto.Fecha, citaIdExcluir: id);
        if (conflicto)
        {
            throw new InvalidOperationException("Existe un conflicto de horario con otra cita para esta mascota.");
        }

        cita.Fecha = dto.Fecha;
        cita.Motivo = dto.Motivo.Trim();

        _unitOfWork.Citas.Update(cita);
        await _unitOfWork.CommitAsync();

        return MapearADto(cita);
    }

    public async Task<bool> DeleteAsync(int id, int currentUserId, string currentUserRole)
    {
        var cita = await _unitOfWork.Citas.GetByIdWithDetailsAsync(id);
        if (cita == null) return false;

        if (!currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
            !currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase) &&
            cita.MascotaNavigation.DueñoId != currentUserId)
        {
            throw new UnauthorizedAccessException("Acceso denegado: No tiene permisos para cancelar esta cita.");
        }

        _unitOfWork.Citas.Delete(cita);
        await _unitOfWork.CommitAsync();
        return true;
    }

    private static CitaResponseDto MapearADto(Cita c)
    {
        return new CitaResponseDto
        {
            Id = c.Id,
            MascotaId = c.MascotaId,
            NombreMascota = c.MascotaNavigation?.Nombre ?? "N/A",
            EspecieMascota = c.MascotaNavigation?.Especie ?? "N/A",
            DueñoId = c.MascotaNavigation?.DueñoId ?? 0,
            NombreDueño = c.MascotaNavigation?.DueñoNavigation?.Nombre ?? "N/A",
            Fecha = c.Fecha,
            Motivo = c.Motivo,
            TotalTratamientos = c.Tratamientos?.Count ?? 0,
            CostoTotalTratamientos = c.Tratamientos?.Sum(t => t.Costo) ?? 0
        };
    }
}

