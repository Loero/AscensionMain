using System.Text.Json.Serialization;

namespace Ascension.Admin.Wpf.Models;

public sealed class AdminLoginResponse
{
  public bool Success { get; set; }
  public string? Token { get; set; }
  public string? Error { get; set; }
}

public sealed class AdminOverviewResponse
{
  public bool Success { get; set; }
  public AdminOverviewDto? Overview { get; set; }
  public string? Error { get; set; }
}

public sealed class AdminUsersResponse
{
  public bool Success { get; set; }
  public List<AdminUserDto>? Users { get; set; }
  public string? Error { get; set; }
}

public sealed class ApiMessageResponse
{
  public bool Success { get; set; }
  public string? Message { get; set; }
  public string? Error { get; set; }
}

public sealed class AdminOverviewDto
{
  [JsonPropertyName("users_count")]
  [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
  public int UsersCount { get; set; }

  [JsonPropertyName("food_entries_count")]
  [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
  public int FoodEntriesCount { get; set; }

  [JsonPropertyName("workout_entries_count")]
  [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
  public int WorkoutEntriesCount { get; set; }

  [JsonPropertyName("skin_routines_count")]
  [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
  public int SkinRoutinesCount { get; set; }

  [JsonPropertyName("total_food_calories")]
  [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
  public double TotalFoodCalories { get; set; }

  [JsonPropertyName("total_burned_calories")]
  [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
  public double TotalBurnedCalories { get; set; }
}

public sealed class AdminUserDto
{
  [JsonPropertyName("id")]
  [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
  public int Id { get; set; }

  [JsonPropertyName("username")]
  public string Username { get; set; } = string.Empty;

  [JsonPropertyName("email")]
  public string Email { get; set; } = string.Empty;

  [JsonPropertyName("created_at")]
  public string CreatedAt { get; set; } = string.Empty;

  [JsonPropertyName("food_entries")]
  [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
  public int FoodEntries { get; set; }

  [JsonPropertyName("workout_entries")]
  [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
  public int WorkoutEntries { get; set; }

  [JsonPropertyName("skin_routines")]
  [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
  public int SkinRoutines { get; set; }

  [JsonPropertyName("total_food_calories")]
  [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
  public double TotalFoodCalories { get; set; }

  [JsonPropertyName("total_burned_calories")]
  [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
  public double TotalBurnedCalories { get; set; }
}
