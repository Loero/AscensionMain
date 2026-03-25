using System;
using System.Collections.Generic;

namespace AscensionBackend.Models;

public partial class SkinConditionLog
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public DateTime Date { get; set; }

    public string? SkinFeeling { get; set; }

    public int? AcneLevel { get; set; }

    public int? OilinessLevel { get; set; }

    public int? HydrationLevel { get; set; }

    public int? SensitivityLevel { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
