using Microsoft.EntityFrameworkCore;
using ClinicaVeterinariaAPI.Models;

namespace ClinicaVeterinariaAPI.Repositories;

public class CitaRepository : Repository<Cita>, ICitaRepository
{
    public CitaRepository(ClinicaDbContext context) : base(context)
    {
    }

    public async Task<(IEnumerable<Cita> Items, int TotalCount)> GetPagedAsync(
        int page, 
        int pageSize, 
        int? dueñoId = null, 
        int? mascotaId = null)
    {
        var query = _dbSet.AsNoTracking()
            .Include(c => c.MascotaNavigation)
                .ThenInclude(m => m.DueñoNavigation)
            .Include(c => c.Tratamientos)
            .AsQueryable();

        if (dueñoId.HasValue)
        {
            query = query.Where(c => c.MascotaNavigation.DueñoId == dueñoId.Value);
        }

        if (mascotaId.HasValue)
        {
            query = query.Where(c => c.MascotaId == mascotaId.Value);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.Fecha)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task<Cita?> GetByIdWithDetailsAsync(int id)
    {
        return await _dbSet
            .Include(c => c.MascotaNavigation)
                .ThenInclude(m => m.DueñoNavigation)
            .Include(c => c.Tratamientos)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<bool> ExisteConflictoHorarioAsync(int mascotaId, DateTime fecha, int? citaIdExcluir = null)
    {
        // Consideramos una ventana de 30 minutos por cita médica
        var inicioVentana = fecha.AddMinutes(-30);
        var finVentana = fecha.AddMinutes(30);

        var query = _dbSet.Where(c => 
            c.MascotaId == mascotaId && 
            c.Fecha >= inicioVentana && 
            c.Fecha <= finVentana);

        if (citaIdExcluir.HasValue)
        {
            query = query.Where(c => c.Id != citaIdExcluir.Value);
        }

        return await query.AnyAsync();
    }
}

