using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ClinicaVeterinariaAPI.Models;

public partial class Mascota
{
    public int Id { get; set; }

    public string Nombre { get; set; } = null!;

    public string Especie { get; set; } = null!;

    public int DueñoId { get; set; }

    [JsonIgnore]
    public virtual Usuario DueñoNavigation { get; set; } = null!;

    [JsonIgnore]
    public virtual ICollection<Cita> Citas { get; set; } = new List<Cita>();
}

