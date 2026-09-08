using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ClinicaVeterinariaAPI.Models;

public partial class Tratamiento
{
    public int Id { get; set; }

    public int CitaId { get; set; }

    public string Descripcion { get; set; } = null!;

    public decimal Costo { get; set; }

    [JsonIgnore]
    public virtual Cita CitaNavigation { get; set; } = null!;
}

