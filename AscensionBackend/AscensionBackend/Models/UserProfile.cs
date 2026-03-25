using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AscensionBackend.Models;

public partial class UserProfile
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? Age { get; set; }

    public decimal? WeightKg { get; set; }

    public int? HeightCm { get; set; }

    public string? Gender { get; set; }

    public decimal? ActivityMultiplier { get; set; }

    public string? Goal { get; set; }

    public string? Experience { get; set; }

    public DateTime UpdatedAt { get; set; }
    [JsonIgnore]
    public virtual User? User { get; set; }
}
