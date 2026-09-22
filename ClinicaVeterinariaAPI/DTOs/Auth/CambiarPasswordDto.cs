using System.ComponentModel.DataAnnotations;

namespace ClinicaVeterinariaAPI.DTOs.Auth;

public class CambiarPasswordDto
{
    [Required(ErrorMessage = "La contraseña actual es requerida.")]
    public string PasswordActual { get; set; } = string.Empty;

    [Required(ErrorMessage = "La nueva contraseña es requerida.")]
    [StringLength(100, MinimumLength = 4, ErrorMessage = "La nueva contraseña debe tener al menos 4 caracteres.")]
    public string NuevoPassword { get; set; } = string.Empty;
}
