using System;
using System.Collections.Generic;

namespace AscensionBackend.Models;

public partial class SkinRoutineTracking
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int RoutineId { get; set; }

    public DateTime Date { get; set; }

    public bool? MorningCompleted { get; set; }

    public bool? EveningCompleted { get; set; }

    public string? MorningSteps { get; set; }

    public string? EveningSteps { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual SkinRoutine Routine { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
