using ClinicaVeterinariaAPI.Models;

namespace ClinicaVeterinariaAPI.Repositories;

public interface IUsuarioRepository : IRepository<Usuario>
{
    Task<Usuario?> GetByEmailAsync(string email);
}

