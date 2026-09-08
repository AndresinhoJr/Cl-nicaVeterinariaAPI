using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ClinicaVeterinariaAPI.Models;

public partial class Cita
{
    public int Id { get; set; }

    public int MascotaId { get; set; }

    public DateTime Fecha { get; set; }

    public string Motivo { get; set; } = null!;

    [JsonIgnore]
    public virtual Mascota MascotaNavigation { get; set; } = null!;

    [JsonIgnore]
    public virtual ICollection<Tratamiento> Tratamientos { get; set; } = new List<Tratamiento>();
}

