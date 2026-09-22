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

    public async Task<IEnumerable<TratamientoResponseDto>> GetAllAsync(int currentUserId, string currentUserRole)
    {
        int? duenoId = (currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                        currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase))
            ? null
            : currentUserId;

        var tratamientos = await _unitOfWork.Tratamientos.GetAllWithDetailsAsync(duenoId);

        return tratamientos.Select(t => new TratamientoResponseDto
        {
            Id = t.Id,
            CitaId = t.CitaId,
            MascotaId = t.CitaNavigation?.MascotaId ?? 0,
            Descripcion = t.Descripcion,
            Costo = t.Costo,
            FechaCita = t.CitaNavigation?.Fecha ?? DateTime.MinValue,
            NombreMascota = t.CitaNavigation?.MascotaNavigation?.Nombre ?? "N/A"
        });
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
            MascotaId = cita.MascotaId,
            Descripcion = t.Descripcion,
            Costo = t.Costo,
            FechaCita = cita.Fecha,
            NombreMascota = cita.MascotaNavigation?.Nombre ?? "N/A"
        });
    }

    public async Task<IEnumerable<TratamientoResponseDto>> GetByMascotaIdAsync(int mascotaId, int currentUserId, string currentUserRole)
    {
        var mascota = await _unitOfWork.Mascotas.GetByIdWithDueñoAsync(mascotaId);
        if (mascota == null)
        {
            throw new KeyNotFoundException($"La mascota con id {mascotaId} no fue encontrada.");
        }

        if (!currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
            !currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase) &&
            mascota.DueñoId != currentUserId)
        {
            throw new UnauthorizedAccessException("Acceso denegado: No tiene permisos para consultar tratamientos de esta mascota.");
        }

        var allTratamientos = await _unitOfWork.Tratamientos.GetAllWithDetailsAsync(
            (!currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
             !currentUserRole.Equals("Veterinario", StringComparison.OrdinalIgnoreCase))
                ? currentUserId
                : null
        );

        return allTratamientos
            .Where(t => t.CitaNavigation?.MascotaId == mascotaId)
            .Select(t => new TratamientoResponseDto
            {
                Id = t.Id,
                CitaId = t.CitaId,
                MascotaId = t.CitaNavigation?.MascotaId ?? mascotaId,
                Descripcion = t.Descripcion,
                Costo = t.Costo,
                FechaCita = t.CitaNavigation?.Fecha ?? DateTime.MinValue,
                NombreMascota = t.CitaNavigation?.MascotaNavigation?.Nombre ?? mascota.Nombre
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
            MascotaId = cita.MascotaId,
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

