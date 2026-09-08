using Microsoft.EntityFrameworkCore;
using ClinicaVeterinariaAPI.Models;

namespace ClinicaVeterinariaAPI.Repositories;

public class UsuarioRepository : Repository<Usuario>, IUsuarioRepository
{
    public UsuarioRepository(ClinicaDbContext context) : base(context)
    {
    }

    public async Task<Usuario?> GetByEmailAsync(string email)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
    }
}

