using System;
using System.Collections.Generic;

namespace AscensionBackend.Models;

public partial class SkinRoutine
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string SkinType { get; set; } = null!;

    public string AgeGroup { get; set; } = null!;

    public string? Concerns { get; set; }

    public string? Goals { get; set; }

    public string? MorningRoutine { get; set; }

    public string? EveningRoutine { get; set; }

    public string? WeeklyTreatments { get; set; }

    public string? ProductRecommendations { get; set; }

    public string? Tips { get; set; }

    public bool? IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<SkinRoutineTracking> SkinRoutineTrackings { get; set; } = new List<SkinRoutineTracking>();

    public virtual User User { get; set; } = null!;
}
