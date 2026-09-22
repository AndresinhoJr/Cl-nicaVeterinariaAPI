using System.ComponentModel.DataAnnotations;

namespace ClinicaVeterinariaAPI.DTOs.Auth;

public class CrearUsuarioDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El correo electrónico es obligatorio.")]
    [EmailAddress(ErrorMessage = "Formato de correo inválido.")]
    [StringLength(150, ErrorMessage = "El correo no puede exceder 150 caracteres.")]
    public string Email { get; set; } = string.Empty;

    [StringLength(100, MinimumLength = 4, ErrorMessage = "La contraseña debe tener al menos 4 caracteres.")]
    public string? Password { get; set; }
}
