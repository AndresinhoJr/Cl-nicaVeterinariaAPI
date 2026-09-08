using ClinicaVeterinariaAPI.Models;

namespace ClinicaVeterinariaAPI.Repositories;

public interface IUnitOfWork : IDisposable
{
    IMascotaRepository Mascotas { get; }
    ICitaRepository Citas { get; }
    IUsuarioRepository Usuarios { get; }
    ITratamientoRepository Tratamientos { get; }
    IRepository<Rol> Roles { get; }

    Task<int> CommitAsync();
}

public class UnitOfWork : IUnitOfWork
{
    private readonly ClinicaDbContext _context;

    public IMascotaRepository Mascotas { get; }
    public ICitaRepository Citas { get; }
    public IUsuarioRepository Usuarios { get; }
    public ITratamientoRepository Tratamientos { get; }
    public IRepository<Rol> Roles { get; }

    public UnitOfWork(ClinicaDbContext context)
    {
        _context = context;
        Mascotas = new MascotaRepository(_context);
        Citas = new CitaRepository(_context);
        Usuarios = new UsuarioRepository(_context);
        Tratamientos = new TratamientoRepository(_context);
        Roles = new Repository<Rol>(_context);
    }

    public async Task<int> CommitAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}

