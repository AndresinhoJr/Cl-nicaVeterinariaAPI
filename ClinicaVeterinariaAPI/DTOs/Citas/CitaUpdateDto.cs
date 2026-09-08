using System.ComponentModel.DataAnnotations;

namespace ClinicaVeterinariaAPI.DTOs.Citas;

public class CitaUpdateDto : IValidatableObject
{
    [Required(ErrorMessage = "La fecha de la cita es obligatoria.")]
    public DateTime Fecha { get; set; }

    [Required(ErrorMessage = "El motivo de la cita es obligatorio.")]
    [StringLength(255, MinimumLength = 5, ErrorMessage = "El motivo debe tener entre 5 y 255 caracteres.")]
    public string Motivo { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Fecha < DateTime.UtcNow.AddMinutes(-5))
        {
            yield return new ValidationResult(
                "La nueva fecha de la cita no puede estar en el pasado.",
                [nameof(Fecha)]
            );
        }
    }
}

