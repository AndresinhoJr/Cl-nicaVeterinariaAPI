using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace ClinicaVeterinariaAPI.Models;

public partial class Usuario
{
    public int Id { get; set; }

    public string Nombre { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Rol { get; set; } = null!;

    [JsonIgnore]
    public string? PasswordHash { get; set; }

    [JsonIgnore]
    public virtual ICollection<Mascota> Mascotas { get; set; } = new List<Mascota>();
}

