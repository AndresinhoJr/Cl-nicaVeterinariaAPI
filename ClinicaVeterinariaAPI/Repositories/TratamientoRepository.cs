using Microsoft.EntityFrameworkCore;
using ClinicaVeterinariaAPI.Models;

namespace ClinicaVeterinariaAPI.Repositories;

public interface ITratamientoRepository : IRepository<Tratamiento>
{
    Task<IEnumerable<Tratamiento>> GetByCitaIdAsync(int citaId);
    Task<IEnumerable<Tratamiento>> GetAllWithDetailsAsync(int? duenoId = null);
}

public class TratamientoRepository : Repository<Tratamiento>, ITratamientoRepository
{
    public TratamientoRepository(ClinicaDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Tratamiento>> GetByCitaIdAsync(int citaId)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(t => t.CitaNavigation)
                .ThenInclude(c => c.MascotaNavigation)
            .Where(t => t.CitaId == citaId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Tratamiento>> GetAllWithDetailsAsync(int? duenoId = null)
    {
        var query = _dbSet
            .AsNoTracking()
            .Include(t => t.CitaNavigation)
                .ThenInclude(c => c.MascotaNavigation)
                    .ThenInclude(m => m.DueñoNavigation)
            .AsQueryable();

        if (duenoId.HasValue)
        {
            query = query.Where(t => t.CitaNavigation.MascotaNavigation.DueñoId == duenoId.Value);
        }

        return await query
            .OrderByDescending(t => t.Id)
            .ToListAsync();
    }
}
