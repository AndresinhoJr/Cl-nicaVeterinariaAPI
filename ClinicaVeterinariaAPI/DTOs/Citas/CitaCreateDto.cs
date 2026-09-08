using System.ComponentModel.DataAnnotations;

namespace ClinicaVeterinariaAPI.DTOs.Citas;

public class CitaCreateDto : IValidatableObject
{
    [Required(ErrorMessage = "El identificador de la mascota es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "El identificador de mascota debe ser un entero positivo.")]
    public int MascotaId { get; set; }

    [Required(ErrorMessage = "La fecha y hora de la cita es obligatoria.")]
    public DateTime Fecha { get; set; }

    [Required(ErrorMessage = "El motivo de la cita es obligatorio.")]
    [StringLength(255, MinimumLength = 5, ErrorMessage = "El motivo debe tener entre 5 y 255 caracteres.")]
    public string Motivo { get; set; } = string.Empty;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Fecha < DateTime.UtcNow.AddMinutes(-5))
        {
            yield return new ValidationResult(
                "La fecha de la cita no puede ser anterior al momento actual.",
                [nameof(Fecha)]
            );
        }
    }
}

