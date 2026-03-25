using System;
using System.Collections.Generic;

namespace AscensionBackend.Models;

public partial class FoodEntry
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string FoodName { get; set; } = null!;

    public int Grams { get; set; }

    public int Calories { get; set; }

    public decimal ProteinG { get; set; }

    public decimal CarbsG { get; set; }

    public DateTime Date { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
