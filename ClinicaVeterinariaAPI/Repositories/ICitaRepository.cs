using ClinicaVeterinariaAPI.Models;

namespace ClinicaVeterinariaAPI.Repositories;

public interface ICitaRepository : IRepository<Cita>
{
    Task<(IEnumerable<Cita> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, int? dueñoId = null, int? mascotaId = null);
    Task<Cita?> GetByIdWithDetailsAsync(int id);
    Task<bool> ExisteConflictoHorarioAsync(int mascotaId, DateTime fecha, int? citaIdExcluir = null);
}

