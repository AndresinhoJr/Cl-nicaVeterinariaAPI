using Microsoft.EntityFrameworkCore;
using ClinicaVeterinariaAPI.Models;

namespace ClinicaVeterinariaAPI.Repositories;

public class MascotaRepository : Repository<Mascota>, IMascotaRepository
{
    public MascotaRepository(ClinicaDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<Mascota> Items, int TotalCount)> GetPagedAsync(
        int page, 
        int pageSize, 
        int? dueñoId = null, 
        string? especie = null)
    {
        var query = _dbSet.AsNoTracking()
            .Include(m => m.DueñoNavigation)
            .AsQueryable();

        if (dueñoId.HasValue)
        {
            query = query.Where(m => m.DueñoId == dueñoId.Value);
        }

        if (!string.IsNullOrWhiteSpace(especie))
        {
            query = query.Where(m => m.Especie.ToLower() == especie.ToLower());
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(m => m.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Mascota?> GetByIdWithDueñoAsync(int id)
    {
        return await _dbSet
            .Include(m => m.DueñoNavigation)
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<IEnumerable<Mascota>> GetByDueñoIdAsync(int dueñoId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(m => m.DueñoId == dueñoId)
            .ToListAsync();
    }
}

