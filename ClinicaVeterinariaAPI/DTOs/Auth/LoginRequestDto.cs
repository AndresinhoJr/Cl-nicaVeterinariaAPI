using System.ComponentModel.DataAnnotations;

namespace ClinicaVeterinariaAPI.DTOs.Auth;

public class LoginRequestDto
{
    [Required(ErrorMessage = "El campo de usuario o correo electrónico es obligatorio.")]
    public string Usuario { get; set; } = string.Empty;

    [Required(ErrorMessage = "El campo de contraseña es obligatorio.")]
    public string Password { get; set; } = string.Empty;

    public string? Email
    {
        get => Usuario;
        set { if (!string.IsNullOrWhiteSpace(value)) Usuario = value; }
    }
}

