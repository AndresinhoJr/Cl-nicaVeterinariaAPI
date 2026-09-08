using System.ComponentModel.DataAnnotations;

namespace ClinicaVeterinariaAPI.DTOs.Auth;

public class RegisterRequestDto
{
    [Required(ErrorMessage = "El campo nombre es obligatorio.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El campo correo electrónico es obligatorio.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "El campo contraseña es obligatorio.")]
    public string Password { get; set; } = string.Empty;
}

