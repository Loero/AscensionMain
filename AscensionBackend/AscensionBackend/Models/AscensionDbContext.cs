using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace AscensionBackend.Models;

public partial class AscensionDbContext : DbContext
{
    public AscensionDbContext()
    {
    }

    public AscensionDbContext(DbContextOptions<AscensionDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<FoodEntry> FoodEntries { get; set; }

    public virtual DbSet<SkinConditionLog> SkinConditionLogs { get; set; }

    public virtual DbSet<SkinRoutine> SkinRoutines { get; set; }

    public virtual DbSet<SkinRoutineTracking> SkinRoutineTrackings { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserProfile> UserProfiles { get; set; }

    public virtual DbSet<WorkoutEntry> WorkoutEntries { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseMySQL("SERVER=localhost;PORT=3306;DATABASE=ascension_db;USER=root;PASSWORD=;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FoodEntry>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("food_entries");

            entity.HasIndex(e => new { e.UserId, e.Date }, "idx_user_date");

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("id");
            entity.Property(e => e.Calories)
                .HasColumnType("int(11)")
                .HasColumnName("calories");
            entity.Property(e => e.CarbsG)
                .HasPrecision(6, 1)
                .HasColumnName("carbs_g");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("'current_timestamp()'")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Date)
                .HasColumnType("date")
                .HasColumnName("date");
            entity.Property(e => e.FoodName)
                .HasMaxLength(200)
                .HasColumnName("food_name");
            entity.Property(e => e.Grams)
                .HasColumnType("int(11)")
                .HasColumnName("grams");
            entity.Property(e => e.ProteinG)
                .HasPrecision(6, 1)
                .HasColumnName("protein_g");
            entity.Property(e => e.UserId)
                .HasColumnType("int(11)")
                .HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.FoodEntries)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("food_entries_ibfk_1");
        });

        modelBuilder.Entity<SkinConditionLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("skin_condition_log");

            entity.HasIndex(e => new { e.UserId, e.Date }, "idx_user_date");

            entity.HasIndex(e => new { e.UserId, e.Date }, "unique_user_date").IsUnique();

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("id");
            entity.Property(e => e.AcneLevel)
                .HasDefaultValueSql("'0'")
                .HasColumnType("int(11)")
                .HasColumnName("acne_level");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("'current_timestamp()'")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Date)
                .HasColumnType("date")
                .HasColumnName("date");
            entity.Property(e => e.HydrationLevel)
                .HasDefaultValueSql("'0'")
                .HasColumnType("int(11)")
                .HasColumnName("hydration_level");
            entity.Property(e => e.Notes)
                .HasDefaultValueSql("'NULL'")
                .HasColumnType("text")
                .HasColumnName("notes");
            entity.Property(e => e.OilinessLevel)
                .HasDefaultValueSql("'0'")
                .HasColumnType("int(11)")
                .HasColumnName("oiliness_level");
            entity.Property(e => e.SensitivityLevel)
                .HasDefaultValueSql("'0'")
                .HasColumnType("int(11)")
                .HasColumnName("sensitivity_level");
            entity.Property(e => e.SkinFeeling)
                .HasMaxLength(50)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("skin_feeling");
            entity.Property(e => e.UserId)
                .HasColumnType("int(11)")
                .HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.SkinConditionLogs)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("skin_condition_log_ibfk_1");
        });

        modelBuilder.Entity<SkinRoutine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("skin_routines");

            entity.HasIndex(e => new { e.UserId, e.IsActive }, "idx_user_active");

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("id");
            entity.Property(e => e.AgeGroup)
                .HasMaxLength(10)
                .HasColumnName("age_group");
            entity.Property(e => e.Concerns)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("concerns");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("'current_timestamp()'")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.EveningRoutine)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("evening_routine");
            entity.Property(e => e.Goals)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("goals");
            entity.Property(e => e.IsActive)
                .HasDefaultValueSql("'1'")
                .HasColumnName("is_active");
            entity.Property(e => e.MorningRoutine)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("morning_routine");
            entity.Property(e => e.ProductRecommendations)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("product_recommendations");
            entity.Property(e => e.SkinType)
                .HasMaxLength(20)
                .HasColumnName("skin_type");
            entity.Property(e => e.Tips)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("tips");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("'current_timestamp()'")
                .HasColumnType("timestamp")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId)
                .HasColumnType("int(11)")
                .HasColumnName("user_id");
            entity.Property(e => e.WeeklyTreatments)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("weekly_treatments");

            entity.HasOne(d => d.User).WithMany(p => p.SkinRoutines)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("skin_routines_ibfk_1");
        });

        modelBuilder.Entity<SkinRoutineTracking>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("skin_routine_tracking");

            entity.HasIndex(e => new { e.UserId, e.Date }, "idx_user_date");

            entity.HasIndex(e => e.RoutineId, "routine_id");

            entity.HasIndex(e => new { e.UserId, e.RoutineId, e.Date }, "unique_user_routine_date").IsUnique();

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("'current_timestamp()'")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Date)
                .HasColumnType("date")
                .HasColumnName("date");
            entity.Property(e => e.EveningCompleted)
                .HasDefaultValueSql("'0'")
                .HasColumnName("evening_completed");
            entity.Property(e => e.EveningSteps)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("evening_steps");
            entity.Property(e => e.MorningCompleted)
                .HasDefaultValueSql("'0'")
                .HasColumnName("morning_completed");
            entity.Property(e => e.MorningSteps)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("morning_steps");
            entity.Property(e => e.Notes)
                .HasDefaultValueSql("'NULL'")
                .HasColumnType("text")
                .HasColumnName("notes");
            entity.Property(e => e.RoutineId)
                .HasColumnType("int(11)")
                .HasColumnName("routine_id");
            entity.Property(e => e.UserId)
                .HasColumnType("int(11)")
                .HasColumnName("user_id");

            entity.HasOne(d => d.Routine).WithMany(p => p.SkinRoutineTrackings)
                .HasForeignKey(d => d.RoutineId)
                .HasConstraintName("skin_routine_tracking_ibfk_2");

            entity.HasOne(d => d.User).WithMany(p => p.SkinRoutineTrackings)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("skin_routine_tracking_ibfk_1");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("users");

            entity.HasIndex(e => e.Email, "email").IsUnique();

            entity.HasIndex(e => e.Username, "username").IsUnique();

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("'current_timestamp()'")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .HasColumnName("email");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.Salt).HasMaxLength(20);
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .HasColumnName("username");
        });

        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("user_profile");

            entity.HasIndex(e => e.UserId, "user_id").IsUnique();

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.ActivityMultiplier)
                .HasPrecision(4)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("activity_multiplier");
            entity.Property(e => e.Age)
                .HasDefaultValueSql("'NULL'")
                .HasColumnType("int(11)")
                .HasColumnName("age");
            entity.Property(e => e.Experience)
                .HasMaxLength(20)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("experience");
            entity.Property(e => e.Gender)
                .HasMaxLength(10)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("gender");
            entity.Property(e => e.Goal)
                .HasMaxLength(20)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("goal");
            entity.Property(e => e.HeightCm)
                .HasDefaultValueSql("'NULL'")
                .HasColumnType("int(11)")
                .HasColumnName("height_cm");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("'current_timestamp()'")
                .HasColumnType("timestamp")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId)
                .HasColumnType("int(11)")
                .HasColumnName("user_id");
            entity.Property(e => e.WeightKg)
                .HasPrecision(5, 1)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("weight_kg");

            entity.HasOne(d => d.User).WithOne(p => p.UserProfile)
                .HasForeignKey<UserProfile>(d => d.UserId)
                .HasConstraintName("user_profile_ibfk_1");
        });

        modelBuilder.Entity<WorkoutEntry>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("workout_entries");

            entity.HasIndex(e => new { e.UserId, e.Date }, "idx_user_date");

            entity.Property(e => e.Id)
                .HasColumnType("int(11)")
                .HasColumnName("id");
            entity.Property(e => e.CaloriesBurned)
                .HasColumnType("int(11)")
                .HasColumnName("calories_burned");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("'current_timestamp()'")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Date)
                .HasColumnType("date")
                .HasColumnName("date");
            entity.Property(e => e.DurationMinutes)
                .HasColumnType("int(11)")
                .HasColumnName("duration_minutes");
            entity.Property(e => e.ExerciseName)
                .HasMaxLength(200)
                .HasColumnName("exercise_name");
            entity.Property(e => e.Notes)
                .HasDefaultValueSql("'NULL'")
                .HasColumnType("text")
                .HasColumnName("notes");
            entity.Property(e => e.Reps)
                .HasDefaultValueSql("'NULL'")
                .HasColumnType("int(11)")
                .HasColumnName("reps");
            entity.Property(e => e.Sets)
                .HasDefaultValueSql("'NULL'")
                .HasColumnType("int(11)")
                .HasColumnName("sets");
            entity.Property(e => e.UserId)
                .HasColumnType("int(11)")
                .HasColumnName("user_id");
            entity.Property(e => e.WeightKg)
                .HasPrecision(5, 1)
                .HasDefaultValueSql("'NULL'")
                .HasColumnName("weight_kg");
            entity.Property(e => e.WorkoutType)
                .HasMaxLength(100)
                .HasColumnName("workout_type");

            entity.HasOne(d => d.User).WithMany(p => p.WorkoutEntries)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("workout_entries_ibfk_1");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
