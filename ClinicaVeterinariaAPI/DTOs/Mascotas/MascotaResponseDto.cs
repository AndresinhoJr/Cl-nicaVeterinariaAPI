namespace ClinicaVeterinariaAPI.DTOs.Mascotas;

public class MascotaResponseDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Especie { get; set; } = string.Empty;
    public int DueñoId { get; set; }
    public string NombreDueño { get; set; } = string.Empty;
    public string EmailDueño { get; set; } = string.Empty;
}

