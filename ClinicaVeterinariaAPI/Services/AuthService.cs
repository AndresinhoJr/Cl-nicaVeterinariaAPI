using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ClinicaVeterinariaAPI.DTOs.Auth;
using ClinicaVeterinariaAPI.Models;
using ClinicaVeterinariaAPI.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace ClinicaVeterinariaAPI.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<Usuario> _hasher = new();

    public AuthService(IUnitOfWork unitOfWork, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request)
    {
        var identificador = string.IsNullOrWhiteSpace(request.Usuario) ? request.Email : request.Usuario;
        if (string.IsNullOrWhiteSpace(identificador))
        {
            return null;
        }

        var usuarios = await _unitOfWork.Usuarios.FindAsync(u =>
            u.Email.ToLower() == identificador.ToLower().Trim() ||
            u.Nombre.ToLower() == identificador.ToLower().Trim());

        var usuario = usuarios.FirstOrDefault();
        if (usuario == null)
        {
            return null;
        }

        if (string.IsNullOrEmpty(usuario.PasswordHash))
        {
            usuario.PasswordHash = _hasher.HashPassword(usuario, request.Password);
            await _unitOfWork.CommitAsync();
        }
        else
        {
            var resultadoVerificacion = _hasher.VerifyHashedPassword(
                usuario, 
                usuario.PasswordHash, 
                request.Password);

            if (resultadoVerificacion == PasswordVerificationResult.Failed)
            {
                if (usuario.PasswordHash == request.Password)
                {
                    usuario.PasswordHash = _hasher.HashPassword(usuario, request.Password);
                    await _unitOfWork.CommitAsync();
                }
                else
                {
                    return null;
                }
            }
        }

        return GenerarTokenJwt(usuario);
    }

    public async Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var existente = await _unitOfWork.Usuarios.GetByEmailAsync(request.Email);
        if (existente != null)
        {
            throw new InvalidOperationException("El correo electrónico ya se encuentra registrado.");
        }

        var nuevoUsuario = new Usuario
        {
            Nombre = request.Nombre.Trim(),
            Email = request.Email.ToLower().Trim(),
            Rol = "Cliente"
        };

        nuevoUsuario.PasswordHash = _hasher.HashPassword(nuevoUsuario, request.Password);

        await _unitOfWork.Usuarios.AddAsync(nuevoUsuario);
        await _unitOfWork.CommitAsync();

        return GenerarTokenJwt(nuevoUsuario);
    }

    private LoginResponseDto GenerarTokenJwt(Usuario usuario)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "Mi_super-clave_ultra-secreta1234_:)";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "ClinicaVeterinariaApi";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "ClinicaVeterinariaUsuarios";
        var expireMinutes = int.TryParse(_configuration["Jwt:ExpireMinutes"], out int exp) ? exp : 60;

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(jwtKey);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Name, usuario.Nombre),
            new(ClaimTypes.Email, usuario.Email),
            new(ClaimTypes.Role, usuario.Rol ?? "Cliente")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expireMinutes),
            Issuer = jwtIssuer,
            Audience = jwtAudience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);

        return new LoginResponseDto
        {
            Token = tokenHandler.WriteToken(token),
            Tipo = "Bearer",
            ExpiraEnMinutos = expireMinutes,
            NombreUsuario = usuario.Nombre,
            Email = usuario.Email,
            Rol = usuario.Rol ?? "Cliente"
        };
    }
}

