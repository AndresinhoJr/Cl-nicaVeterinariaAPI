using Microsoft.EntityFrameworkCore;
using ClinicaVeterinariaAPI.Models;

namespace ClinicaVeterinariaAPI.Repositories;

public interface ITratamientoRepository : IRepository<Tratamiento>
{
    Task<IEnumerable<Tratamiento>> GetByCitaIdAsync(int citaId);
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
}

