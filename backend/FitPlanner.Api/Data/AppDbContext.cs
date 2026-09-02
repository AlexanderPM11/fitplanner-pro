using FitPlanner.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FitPlanner.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<ApplicationUser, Microsoft.AspNetCore.Identity.IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Workout> Workouts => Set<Workout>();
    public DbSet<WorkoutExercise> WorkoutExercises => Set<WorkoutExercise>();
    public DbSet<WorkoutSet> WorkoutSets => Set<WorkoutSet>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<ScheduleCompletion> ScheduleCompletions => Set<ScheduleCompletion>();
    public DbSet<FavoriteExercise> FavoriteExercises => Set<FavoriteExercise>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<Exercise>().ToTable("exercises").HasKey(item => item.Id);
        builder.Entity<Exercise>().Property(item => item.Name).HasMaxLength(160).IsRequired();
        builder.Entity<Exercise>().Property(item => item.Category).HasMaxLength(80).IsRequired();
        builder.Entity<Exercise>().HasData(
            new Exercise { Id = Guid.Parse("2f3c6b1a-7f3e-4e9f-9b24-000000000001"), Name = "Press de banca", Category = "Pecho", Description = "Empuje horizontal para desarrollar el pectoral.", CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Exercise { Id = Guid.Parse("2f3c6b1a-7f3e-4e9f-9b24-000000000002"), Name = "Sentadilla", Category = "Piernas", Description = "Movimiento base para fuerza de piernas.", CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Exercise { Id = Guid.Parse("2f3c6b1a-7f3e-4e9f-9b24-000000000003"), Name = "Peso muerto", Category = "Espalda", Description = "Patrón de bisagra para fuerza posterior.", CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Exercise { Id = Guid.Parse("2f3c6b1a-7f3e-4e9f-9b24-000000000004"), Name = "Dominadas", Category = "Espalda", Description = "Tracción vertical para espalda y brazos.", CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
            new Exercise { Id = Guid.Parse("2f3c6b1a-7f3e-4e9f-9b24-000000000005"), Name = "Press militar", Category = "Hombros", Description = "Empuje vertical controlado.", CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
        );
        builder.Entity<Workout>().ToTable("workouts").HasKey(item => item.Id);
        builder.Entity<Workout>().Property(item => item.Name).HasMaxLength(160).IsRequired();
        builder.Entity<Workout>().HasMany(item => item.Exercises).WithOne(item => item.Workout).HasForeignKey(item => item.WorkoutId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<WorkoutExercise>().ToTable("workout_exercises").HasKey(item => item.Id);
        builder.Entity<WorkoutExercise>().HasOne(item => item.Exercise).WithMany().HasForeignKey(item => item.ExerciseId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<WorkoutExercise>().HasMany(item => item.Sets).WithOne(item => item.WorkoutExercise).HasForeignKey(item => item.WorkoutExerciseId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<WorkoutSet>().ToTable("sets").HasKey(item => item.Id);
        builder.Entity<Schedule>().ToTable("schedules").HasKey(item => item.Id);
        builder.Entity<Schedule>().HasOne(item => item.Workout).WithMany().HasForeignKey(item => item.WorkoutId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ScheduleCompletion>().ToTable("schedule_completions").HasKey(item => item.Id);
        builder.Entity<ScheduleCompletion>().HasIndex(item => new { item.UserId, item.ScheduleId, item.CompletedAt }).IsUnique();
        builder.Entity<FavoriteExercise>().ToTable("favorite_exercises").HasKey(item => new { item.UserId, item.ExerciseId });
    }
}
