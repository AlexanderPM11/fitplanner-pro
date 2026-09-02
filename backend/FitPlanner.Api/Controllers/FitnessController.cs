using System.Security.Claims;
using FitPlanner.Api.Data;
using FitPlanner.Api.Models;
using FitPlanner.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitPlanner.Api.Controllers;

[ApiController, Authorize, Route("api")]
public sealed class FitnessController(AppDbContext db, RapidApiCatalogService rapidApi) : ControllerBase
{
    [HttpGet("exercises")]
    public async Task<IReadOnlyList<ExerciseResponse>> Exercises(CancellationToken cancellationToken)
    {
        var query = db.Exercises.AsNoTracking().Where(item => item.Source == "rapidapi");
        return await query.OrderBy(item => item.Category).ThenBy(item => item.Name)
            .Select(item => new ExerciseResponse(item.Id, item.Name, item.Category, item.Description, item.ImageUrl, item.VideoUrl, item.Equipment, item.MovementType, item.ExternalId, item.Source))
            .ToListAsync(cancellationToken);
    }

    [HttpGet("exercises/{id:guid}")]
    public async Task<IActionResult> ExerciseDetails(Guid id, CancellationToken cancellationToken)
    {
        var exercise = await db.Exercises.SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (exercise is null) return NotFound();

        if (exercise.Source == "rapidapi" && !string.IsNullOrWhiteSpace(exercise.ExternalId))
        {
            var details = await rapidApi.GetDetailsAsync(exercise.ExternalId, cancellationToken);
            if (details is not null)
            {
                exercise.ImageUrl = details.ImageUrl ?? exercise.ImageUrl;
                exercise.VideoUrl = details.GifUrl ?? details.VideoUrl ?? exercise.VideoUrl;
                exercise.Description = details.Description ?? exercise.Description;
                await db.SaveChangesAsync(cancellationToken);
                return Ok(new ExerciseDetailsResponse(exercise.Id, details.Name, details.Category, details.Description, details.ImageUrl ?? exercise.ImageUrl, details.GifUrl ?? details.VideoUrl ?? exercise.VideoUrl, details.Equipment, details.MovementType, details.Instructions, exercise.ExternalId, exercise.Source));
            }
        }

        return Ok(new ExerciseDetailsResponse(exercise.Id, exercise.Name, exercise.Category, exercise.Description, exercise.ImageUrl, exercise.VideoUrl, exercise.Equipment, exercise.MovementType, [], exercise.ExternalId, exercise.Source));
    }

    [HttpGet("routines")]
    public async Task<IReadOnlyList<RoutineResponse>> Routines(CancellationToken cancellationToken)
    {
        var userId = UserId();
        return await db.Workouts.AsNoTracking().Where(item => item.UserId == userId && item.IsTemplate).OrderByDescending(item => item.CreatedAtUtc).Select(item => new RoutineResponse(item.Id, item.Name, item.Description, item.Exercises.Count)).ToListAsync(cancellationToken);
    }

    [HttpPost("routines")]
    public async Task<IActionResult> CreateRoutine(CreateRoutineRequest request, CancellationToken cancellationToken)
    {
        var routine = new Workout { UserId = UserId(), Name = request.Name.Trim(), Description = request.Description?.Trim(), IsTemplate = true };
        for (var index = 0; index < request.ExerciseIds.Count; index++) routine.Exercises.Add(new WorkoutExercise { ExerciseId = request.ExerciseIds[index], OrderIndex = index });
        db.Workouts.Add(routine); await db.SaveChangesAsync(cancellationToken);
        return Created($"/api/routines/{routine.Id}", new { id = routine.Id });
    }

    [HttpDelete("routines/{id:guid}")]
    public async Task<IActionResult> DeleteRoutine(Guid id, CancellationToken cancellationToken)
    {
        var routine = await db.Workouts.SingleOrDefaultAsync(item => item.Id == id && item.UserId == UserId() && item.IsTemplate, cancellationToken);
        if (routine is null) return NotFound();
        db.Workouts.Remove(routine); await db.SaveChangesAsync(cancellationToken); return NoContent();
    }

    [HttpPost("exercises/{id:guid}/favorite")]
    public async Task<IActionResult> ToggleFavorite(Guid id, CancellationToken cancellationToken)
    {
        var userId = UserId();
        var favorite = await db.Set<FavoriteExercise>().SingleOrDefaultAsync(item => item.UserId == userId && item.ExerciseId == id, cancellationToken);
        if (favorite is null) db.Add(new FavoriteExercise { UserId = userId, ExerciseId = id }); else db.Remove(favorite);
        await db.SaveChangesAsync(cancellationToken); return Ok(new { isFavorite = favorite is null });
    }

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
}

public record ExerciseResponse(Guid Id, string Name, string Category, string? Description, string? ImageUrl, string? VideoUrl, string? Equipment, string? MovementType, string? ExternalId, string Source);
public record ExerciseDetailsResponse(Guid Id, string Name, string Category, string? Description, string? ImageUrl, string? VideoUrl, string? Equipment, string? MovementType, List<string> Instructions, string? ExternalId, string Source);
public record RoutineResponse(Guid Id, string Name, string? Description, int ExerciseCount);
public record CreateRoutineRequest(string Name, string? Description, List<Guid> ExerciseIds);
