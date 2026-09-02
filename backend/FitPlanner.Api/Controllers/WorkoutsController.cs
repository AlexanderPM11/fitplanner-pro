using System.Security.Claims;
using FitPlanner.Api.Data;
using FitPlanner.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitPlanner.Api.Controllers;

[ApiController, Authorize, Route("api/workouts")]
public sealed class WorkoutsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IReadOnlyList<WorkoutResponse>> List([FromQuery] bool? templates, CancellationToken cancellationToken)
    {
        var query = db.Workouts.AsNoTracking().Where(item => item.UserId == UserId());
        if (templates.HasValue) query = query.Where(item => item.IsTemplate == templates.Value);
        return await query.OrderByDescending(item => item.StartedAtUtc).Select(ToResponse()).ToListAsync(cancellationToken);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var workout = await db.Workouts.AsNoTracking().Where(item => item.Id == id && item.UserId == UserId()).Select(ToResponse()).SingleOrDefaultAsync(cancellationToken);
        return workout is null ? NotFound() : Ok(workout);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateWorkoutRequest request, CancellationToken cancellationToken)
    {
        var workout = new Workout { UserId = UserId(), Name = request.Name.Trim(), Description = request.Description?.Trim(), IsTemplate = request.IsTemplate, StartedAtUtc = request.StartedAtUtc ?? DateTime.UtcNow, CompletedAtUtc = request.CompletedAtUtc };
        foreach (var exercise in request.Exercises.Select((item, index) => (item, index))) workout.Exercises.Add(new WorkoutExercise { ExerciseId = exercise.item.ExerciseId, OrderIndex = exercise.index, Sets = exercise.item.Sets.Select((set, index) => new WorkoutSet { Weight = set.Weight, Reps = set.Reps, Completed = set.Completed, OrderIndex = index }).ToList() });
        db.Workouts.Add(workout); await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = workout.Id }, new { id = workout.Id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateWorkoutRequest request, CancellationToken cancellationToken)
    {
        var workout = await db.Workouts.Include(item => item.Exercises).ThenInclude(item => item.Sets).SingleOrDefaultAsync(item => item.Id == id && item.UserId == UserId(), cancellationToken);
        if (workout is null) return NotFound();
        workout.Name = request.Name.Trim(); workout.Description = request.Description?.Trim(); workout.CompletedAtUtc = request.CompletedAtUtc;
        db.WorkoutExercises.RemoveRange(workout.Exercises); workout.Exercises.Clear();
        foreach (var exercise in request.Exercises.Select((item, index) => (item, index))) workout.Exercises.Add(new WorkoutExercise { WorkoutId = id, ExerciseId = exercise.item.ExerciseId, OrderIndex = exercise.index, Sets = exercise.item.Sets.Select((set, index) => new WorkoutSet { Weight = set.Weight, Reps = set.Reps, Completed = set.Completed, OrderIndex = index }).ToList() });
        await db.SaveChangesAsync(cancellationToken); return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var workout = await db.Workouts.SingleOrDefaultAsync(item => item.Id == id && item.UserId == UserId(), cancellationToken);
        if (workout is null) return NotFound(); db.Workouts.Remove(workout); await db.SaveChangesAsync(cancellationToken); return NoContent();
    }

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
    private static System.Linq.Expressions.Expression<Func<Workout, WorkoutResponse>> ToResponse() => item => new WorkoutResponse(item.Id, item.Name, item.Description, item.IsTemplate, item.StartedAtUtc, item.CompletedAtUtc, item.Exercises.OrderBy(exercise => exercise.OrderIndex).Select(exercise => new WorkoutExerciseResponse(exercise.Id, exercise.ExerciseId, exercise.OrderIndex, exercise.Exercise.Name, exercise.Exercise.Category, exercise.Exercise.ImageUrl, exercise.Exercise.VideoUrl, exercise.Sets.OrderBy(set => set.OrderIndex).Select(set => new SetResponse(set.Id, set.Weight, set.Reps, set.Completed, set.OrderIndex)).ToList())).ToList());
}

public record WorkoutResponse(Guid Id, string Name, string? Description, bool IsTemplate, DateTime StartedAtUtc, DateTime? CompletedAtUtc, List<WorkoutExerciseResponse> Exercises);
public record WorkoutExerciseResponse(Guid Id, Guid ExerciseId, int OrderIndex, string? ExerciseName, string? Category, string? ImageUrl, string? VideoUrl, List<SetResponse> Sets);
public record SetResponse(Guid Id, double? Weight, int? Reps, bool Completed, int OrderIndex);
public record WorkoutExerciseRequest(Guid ExerciseId, List<SetRequest> Sets);
public record SetRequest(double? Weight, int? Reps, bool Completed);
public record CreateWorkoutRequest(string Name, string? Description, bool IsTemplate, DateTime? StartedAtUtc, DateTime? CompletedAtUtc, List<WorkoutExerciseRequest> Exercises);
public record UpdateWorkoutRequest(string Name, string? Description, DateTime? CompletedAtUtc, List<WorkoutExerciseRequest> Exercises);
