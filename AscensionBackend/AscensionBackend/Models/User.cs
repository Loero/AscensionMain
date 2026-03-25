using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AscensionBackend.Models;

public partial class User
{
    public int Id { get; set; }

    public string Username { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public string? Salt { get; set; }

    [JsonIgnore]
    public virtual ICollection<FoodEntry> FoodEntries { get; set; } = new List<FoodEntry>();
    [JsonIgnore]
    public virtual ICollection<SkinConditionLog> SkinConditionLogs { get; set; } = new List<SkinConditionLog>();
    [JsonIgnore]
    public virtual ICollection<SkinRoutineTracking> SkinRoutineTrackings { get; set; } = new List<SkinRoutineTracking>();
    [JsonIgnore]
    public virtual ICollection<SkinRoutine> SkinRoutines { get; set; } = new List<SkinRoutine>();
    [JsonIgnore]
    public virtual UserProfile? UserProfile { get; set; }
    [JsonIgnore]
    public virtual ICollection<WorkoutEntry> WorkoutEntries { get; set; } = new List<WorkoutEntry>();
}
