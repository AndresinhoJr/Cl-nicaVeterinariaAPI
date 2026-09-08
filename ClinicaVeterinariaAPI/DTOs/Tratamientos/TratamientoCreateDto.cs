using System.ComponentModel.DataAnnotations;

namespace ClinicaVeterinariaAPI.DTOs.Tratamientos;

public class TratamientoCreateDto
{
    [Required(ErrorMessage = "El identificador de la cita es obligatorio.")]
    [Range(1, int.MaxValue, ErrorMessage = "El Id de cita debe ser mayor a 0.")]
    public int CitaId { get; set; }

    [Required(ErrorMessage = "La descripción del tratamiento es obligatoria.")]
    [StringLength(255, MinimumLength = 5, ErrorMessage = "La descripción debe tener entre 5 y 255 caracteres.")]
    public string Descripcion { get; set; } = string.Empty;

    [Required(ErrorMessage = "El costo del tratamiento es obligatorio.")]
    [Range(0.01, 1000000.00, ErrorMessage = "El costo debe ser un valor positivo mayor a cero.")]
    public decimal Costo { get; set; }
}

