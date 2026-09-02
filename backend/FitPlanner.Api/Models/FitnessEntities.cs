namespace FitPlanner.Api.Models;

public sealed class Exercise
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string? VideoUrl { get; set; }
    public string? Equipment { get; set; }
    public string? MovementType { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed class Workout
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsTemplate { get; set; }
    public DateTime StartedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public List<WorkoutExercise> Exercises { get; set; } = [];
}

public sealed class WorkoutExercise
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkoutId { get; set; }
    public Guid ExerciseId { get; set; }
    public int OrderIndex { get; set; }
    public Workout Workout { get; set; } = null!;
    public Exercise Exercise { get; set; } = null!;
    public List<WorkoutSet> Sets { get; set; } = [];
}

public sealed class WorkoutSet
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkoutExerciseId { get; set; }
    public double? Weight { get; set; }
    public int? Reps { get; set; }
    public bool Completed { get; set; }
    public int OrderIndex { get; set; }
    public WorkoutExercise WorkoutExercise { get; set; } = null!;
}

public sealed class Schedule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid WorkoutId { get; set; }
    public int DayOfWeek { get; set; }
    public Workout Workout { get; set; } = null!;
}

public sealed class ScheduleCompletion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid ScheduleId { get; set; }
    public DateOnly CompletedAt { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
