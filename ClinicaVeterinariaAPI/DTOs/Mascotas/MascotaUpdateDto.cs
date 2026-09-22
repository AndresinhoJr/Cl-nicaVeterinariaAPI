using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ClinicaVeterinariaAPI.DTOs.Mascotas;

public class MascotaUpdateDto : IValidatableObject
{
    private static readonly string[] EspeciesValidas = ["Perro", "Gato", "Ave", "Conejo", "Roedor", "Reptil", "Otro"];

    [Required(ErrorMessage = "El nombre de la mascota es obligatorio.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "La especie es obligatoria.")]
    [StringLength(50, ErrorMessage = "La especie no puede exceder 50 caracteres.")]
    public string Especie { get; set; } = string.Empty;

    public int? DueñoId { get; set; }

    [JsonPropertyName("duenoId")]
    public int? DuenoId { get => DueñoId; set => DueñoId = value; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!EspeciesValidas.Contains(Especie, StringComparer.OrdinalIgnoreCase))
        {
            yield return new ValidationResult(
                $"La especie '{Especie}' no es admitida. Especies comunes: {string.Join(", ", EspeciesValidas)}.",
                [nameof(Especie)]
            );
        }
    }
}
