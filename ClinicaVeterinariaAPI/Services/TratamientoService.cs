using ClinicaVeterinariaAPI.DTOs.Tratamientos;
using ClinicaVeterinariaAPI.Models;
using ClinicaVeterinariaAPI.Repositories;

namespace ClinicaVeterinariaAPI.Services;

public class TratamientoService : ITratamientoService
{
    private readonly IUnitOfWork _unitOfWork;

    public TratamientoService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<TratamientoResponseDto>> GetByCitaIdAsync(int citaId, int currentUserId, string currentUserRole)
    {
        var cita = await _unitOfWork.Citas.GetByIdWithDetailsAsync(citaId);
        if (cita == null)
        {
            throw new KeyNotFoundException($"La cita médica con id {citaId} no existe.");
        }


        if (!currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
            !currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase) &&
            cita.MascotaNavigation.DueñoId != currentUserId)
        {
            throw new UnauthorizedAccessException("Acceso denegado: No tiene permisos para consultar tratamientos de esta cita.");
        }

        var tratamientos = await _unitOfWork.Tratamientos.GetByCitaIdAsync(citaId);
        return tratamientos.Select(t => new TratamientoResponseDto
        {
            Id = t.Id,
            CitaId = t.CitaId,
            Descripcion = t.Descripcion,
            Costo = t.Costo,
            FechaCita = cita.Fecha,
            NombreMascota = cita.MascotaNavigation?.Nombre ?? "N/A"
        });
    }

    public async Task<TratamientoResponseDto> CreateAsync(TratamientoCreateDto dto)
    {
        var cita = await _unitOfWork.Citas.GetByIdWithDetailsAsync(dto.CitaId);
        if (cita == null)
        {
            throw new KeyNotFoundException($"La cita médica con id {dto.CitaId} no existe.");
        }

        var nuevoTratamiento = new Tratamiento
        {
            CitaId = dto.CitaId,
            Descripcion = dto.Descripcion.Trim(),
            Costo = dto.Costo
        };

        await _unitOfWork.Tratamientos.AddAsync(nuevoTratamiento);
        await _unitOfWork.CommitAsync();

        return new TratamientoResponseDto
        {
            Id = nuevoTratamiento.Id,
            CitaId = nuevoTratamiento.CitaId,
            Descripcion = nuevoTratamiento.Descripcion,
            Costo = nuevoTratamiento.Costo,
            FechaCita = cita.Fecha,
            NombreMascota = cita.MascotaNavigation?.Nombre ?? "N/A"
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var tratamiento = await _unitOfWork.Tratamientos.GetByIdAsync(id);
        if (tratamiento == null) return false;

        _unitOfWork.Tratamientos.Delete(tratamiento);
        await _unitOfWork.CommitAsync();
        return true;
    }
}

