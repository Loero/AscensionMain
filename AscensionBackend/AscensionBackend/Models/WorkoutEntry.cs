using System;
using System.Collections.Generic;

namespace AscensionBackend.Models;

public partial class WorkoutEntry
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string WorkoutType { get; set; } = null!;

    public string ExerciseName { get; set; } = null!;

    public int DurationMinutes { get; set; }

    public int CaloriesBurned { get; set; }

    public int? Sets { get; set; }

    public int? Reps { get; set; }

    public decimal? WeightKg { get; set; }

    public string? Notes { get; set; }

    public DateTime Date { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
