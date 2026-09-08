using ClinicaVeterinariaAPI.Models;

namespace ClinicaVeterinariaAPI.Repositories;

public interface IMascotaRepository : IRepository<Mascota>
{
    Task<(IEnumerable<Mascota> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, int? dueñoId = null, string? especie = null);
    Task<Mascota?> GetByIdWithDueñoAsync(int id);
    Task<IEnumerable<Mascota>> GetByDueñoIdAsync(int dueñoId);
}

