namespace ClinicaVeterinariaAPI.DTOs.Tratamientos;

public class TratamientoResponseDto
{
    public int Id { get; set; }
    public int CitaId { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public decimal Costo { get; set; }
    public DateTime FechaCita { get; set; }
    public string NombreMascota { get; set; } = string.Empty;
}

