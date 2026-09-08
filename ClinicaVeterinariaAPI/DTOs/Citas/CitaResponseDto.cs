namespace ClinicaVeterinariaAPI.DTOs.Citas;

public class CitaResponseDto
{
    public int Id { get; set; }
    public int MascotaId { get; set; }
    public string NombreMascota { get; set; } = string.Empty;
    public string EspecieMascota { get; set; } = string.Empty;
    public int DueñoId { get; set; }
    public string NombreDueño { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public int TotalTratamientos { get; set; }
    public decimal CostoTotalTratamientos { get; set; }
}

